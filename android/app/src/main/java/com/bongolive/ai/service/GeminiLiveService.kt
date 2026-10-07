package com.bongolive.ai.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.*
import android.os.Binder
import android.os.IBinder
import android.os.PowerManager
import android.util.Base64
import android.util.Log
import androidx.core.app.NotificationCompat
import com.bongolive.ai.BongoLiveApp
import com.bongolive.ai.MainActivity
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.TimeUnit

class GeminiLiveService : Service() {

    private val binder = LocalBinder()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val gson = Gson()

    // OkHttpClient with zero read-timeout for continuous duplex streaming
    private val httpClient = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .connectTimeout(15, TimeUnit.SECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isClosedManually = false
    private var wakeLock: PowerManager.WakeLock? = null

    // Native AudioRecord (16 kHz, 16-bit PCM Mono)
    private val recordSampleRate = 16000
    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    private var recordingJob: Job? = null

    // Native AudioTrack (24 kHz, 16-bit PCM Mono)
    private val playSampleRate = 24000
    private var audioTrack: AudioTrack? = null
    private val audioQueue = ConcurrentLinkedQueue<ByteArray>()
    @Volatile
    private var isPlaying = false
    private var playbackThread: Thread? = null

    // Active session configuration
    private var currentApiKey: String = ""
    private var currentModel: String = "gemini-2.0-flash-exp"
    private var currentVoice: String = "Kore"
    private var currentSystemInstruction: String = ""

    // Diagnostic tracking variables
    var diagnosticLastError: String = ""
        private set
    var diagnosticLastConnectedTimestamp: Long = 0L
        private set
    var diagnosticLastMessageTimestamp: Long = 0L
        private set
    var diagnosticLastAudioTimestamp: Long = 0L
        private set
    var diagnosticReconnectCount: Int = 0
        private set

    // Observable session state
    private val _isLiveConnected = MutableStateFlow(false)
    val isLiveConnected = _isLiveConnected.asStateFlow()

    private val _currentAssistantCaption = MutableStateFlow("")
    val currentAssistantCaption = _currentAssistantCaption.asStateFlow()

    private val _currentUserCaption = MutableStateFlow("")
    val currentUserCaption = _currentUserCaption.asStateFlow()

    private val _toolCallEvents = MutableSharedFlow<Pair<String, JsonObject>>()
    val toolCallEvents = _toolCallEvents.asSharedFlow()

    inner class LocalBinder : Binder() {
        fun getService(): GeminiLiveService = this@GeminiLiveService
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BongoLive::GeminiLiveServiceWakeLock").apply {
            setReferenceCounted(false)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        wakeLock?.acquire(60 * 60 * 1000L) // Keep CPU running for continuous voice

        val apiKey = intent?.getStringExtra(EXTRA_API_KEY) ?: ""
        val voice = intent?.getStringExtra(EXTRA_VOICE) ?: "Kore"
        val model = intent?.getStringExtra(EXTRA_MODEL) ?: "gemini-2.0-flash-exp"
        val instruction = intent?.getStringExtra(EXTRA_INSTRUCTION)
            ?: "আপনি 'MYRA (মায়রা)' - একজন ইউনিভার্সাল অটোনোমাস এআই সহকারী।"

        if (apiKey.isNotBlank()) {
            startSession(apiKey, model, voice, instruction)
        }

        return START_NOT_STICKY
    }

    /**
     * Connects to official Gemini Live WebSocket and initializes full-duplex audio.
     */
    fun startSession(
        apiKey: String,
        model: String = "gemini-2.0-flash-exp",
        voice: String = "Kore",
        systemInstruction: String = "আপনি 'MYRA (মায়রা)' - একজন ইউনিভার্সাল অটোনোমাস এআই সহকারী।"
    ) {
        stopSession()
        isClosedManually = false
        currentApiKey = apiKey
        currentModel = model
        currentVoice = voice
        currentSystemInstruction = systemInstruction

        val normalizedModel = if (model.startsWith("models/")) model else "models/$model"
        val wsUrl = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=$apiKey"

        val request = Request.Builder()
            .url(wsUrl)
            .addHeader("User-Agent", "BongoLive-Android-GeminiLiveService")
            .build()

        webSocket = httpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "Gemini Live WebSocket opened successfully")
                _isLiveConnected.value = true
                diagnosticLastConnectedTimestamp = System.currentTimeMillis()
                diagnosticLastError = ""

                // 1. Send BidiGenerateContentSetup payload
                sendSetupMessage(webSocket)

                // 2. Start native AudioTrack player
                initializeAudioTrack()

                // 3. Start native AudioRecord capture
                startAudioRecord()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                diagnosticLastMessageTimestamp = System.currentTimeMillis()
                handleIncomingMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "Gemini Live WebSocket failed: ${t.message}")
                diagnosticLastError = t.message ?: "Network error"
                _isLiveConnected.value = false
                stopAudioCaptureAndPlayback()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "Gemini Live WebSocket closed: $reason")
                _isLiveConnected.value = false
                stopAudioCaptureAndPlayback()
            }
        })
    }

    private fun sendSetupMessage(ws: WebSocket) {
        val normalizedModel = if (currentModel.startsWith("models/")) currentModel else "models/$currentModel"
        val payload = JsonObject().apply {
            val setupObj = JsonObject().apply {
                addProperty("model", normalizedModel)

                val genConfig = JsonObject().apply {
                    val modalities = JsonArray().apply { add("AUDIO") }
                    add("responseModalities", modalities)

                    val speechConfig = JsonObject().apply {
                        val voiceConfig = JsonObject().apply {
                            val prebuilt = JsonObject().apply {
                                addProperty("voiceName", currentVoice)
                            }
                            add("prebuiltVoiceConfig", prebuilt)
                        }
                        add("voiceConfig", voiceConfig)
                    }
                    add("speechConfig", speechConfig)
                }
                add("generationConfig", genConfig)

                if (currentSystemInstruction.isNotBlank()) {
                    val sysInst = JsonObject().apply {
                        val partsArr = JsonArray().apply {
                            val part = JsonObject().apply { addProperty("text", currentSystemInstruction) }
                            add(part)
                        }
                        add("parts", partsArr)
                    }
                    add("systemInstruction", sysInst)
                }
            }
            add("setup", setupObj)
        }

        ws.send(gson.toJson(payload))
    }

    private fun handleIncomingMessage(text: String) {
        try {
            val json = gson.fromJson(text, JsonObject::class.java)

            if (json.has("serverContent")) {
                val sc = json.getAsJsonObject("serverContent")

                // Speech interruption by user
                if (sc.has("interrupted") && sc.get("interrupted").asBoolean) {
                    interrupt()
                }

                // Audio modelTurn parts
                if (sc.has("modelTurn")) {
                    val modelTurn = sc.getAsJsonObject("modelTurn")
                    val parts = modelTurn.getAsJsonArray("parts")
                    if (parts != null) {
                        for (p in parts) {
                            val partObj = p.asJsonObject
                            if (partObj.has("inlineData")) {
                                val inlineData = partObj.getAsJsonObject("inlineData")
                                val base64 = inlineData.get("data")?.asString
                                if (!base64.isNullOrEmpty()) {
                                    val pcmBytes = Base64.decode(base64, Base64.NO_WRAP)
                                    queueAudioForPlayback(pcmBytes)
                                }
                            }
                        }
                    }
                }

                // Assistant live captions
                if (sc.has("outputTranscription")) {
                    val ot = sc.getAsJsonObject("outputTranscription")
                    val otText = ot.get("text")?.asString
                    if (!otText.isNullOrBlank()) {
                        _currentAssistantCaption.value = otText
                    }
                }

                // User live speech recognition caption
                if (sc.has("inputTranscription")) {
                    val itObj = sc.getAsJsonObject("inputTranscription")
                    val itText = itObj.get("text")?.asString
                    if (!itText.isNullOrBlank()) {
                        _currentUserCaption.value = itText
                    }
                }
            }

            // Function calling / Tools
            if (json.has("toolCall")) {
                val tc = json.getAsJsonObject("toolCall")
                val fCalls = tc.getAsJsonArray("functionCalls")
                if (fCalls != null) {
                    for (fc in fCalls) {
                        val fcObj = fc.asJsonObject
                        val callId = fcObj.get("id")?.asString ?: ""
                        val name = fcObj.get("name")?.asString ?: ""
                        val args = fcObj.getAsJsonObject("args") ?: JsonObject()
                        serviceScope.launch {
                            _toolCallEvents.emit(Pair(name, args))
                        }
                        // Immediate default confirmation response
                        sendToolResponse(callId, "executed")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling Gemini Live incoming message: ${e.message}")
        }
    }

    /**
     * Native AudioRecord capture loop.
     */
    @SuppressLint("MissingPermission")
    private fun startAudioRecord() {
        if (isRecording) return

        val channelConfig = AudioFormat.CHANNEL_IN_MONO
        val audioEncoding = AudioFormat.ENCODING_PCM_16BIT
        val minBufferSize = AudioRecord.getMinBufferSize(recordSampleRate, channelConfig, audioEncoding)
        val bufferSize = maxOf(minBufferSize, 2048)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                recordSampleRate,
                channelConfig,
                audioEncoding,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord state not initialized")
                return
            }

            audioRecord?.startRecording()
            isRecording = true

            recordingJob = serviceScope.launch(Dispatchers.IO) {
                val buffer = ByteArray(2048)
                while (isActive && isRecording) {
                    val readBytes = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (readBytes > 0) {
                        val chunk = buffer.copyOf(readBytes)
                        sendAudioChunk(chunk)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start native AudioRecord: ${e.message}")
        }
    }

    /**
     * Native AudioTrack playback engine.
     */
    private fun initializeAudioTrack() {
        if (audioTrack != null) return

        val channelConfig = AudioFormat.CHANNEL_OUT_MONO
        val audioEncoding = AudioFormat.ENCODING_PCM_16BIT
        val minBufferSize = AudioTrack.getMinBufferSize(playSampleRate, channelConfig, audioEncoding)
        val bufferSize = maxOf(minBufferSize, 4096)

        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()

        val format = AudioFormat.Builder()
            .setSampleRate(playSampleRate)
            .setChannelMask(channelConfig)
            .setEncoding(audioEncoding)
            .build()

        audioTrack = AudioTrack(
            attributes,
            format,
            bufferSize,
            AudioTrack.MODE_STREAM,
            AudioManager.AUDIO_SESSION_ID_GENERATE
        )

        audioTrack?.play()
        isPlaying = true

        playbackThread = Thread {
            while (isPlaying) {
                val chunk = audioQueue.poll()
                if (chunk != null) {
                    audioTrack?.write(chunk, 0, chunk.size)
                } else {
                    try {
                        Thread.sleep(10)
                    } catch (e: InterruptedException) {
                        break
                    }
                }
            }
        }.apply { start() }
    }

    private fun queueAudioForPlayback(pcmBytes: ByteArray) {
        if (audioTrack == null) {
            initializeAudioTrack()
        }
        audioQueue.add(pcmBytes)
    }

    /**
     * Streams 16 kHz PCM microphone audio chunk to Gemini Live.
     */
    fun sendAudioChunk(pcmBytes: ByteArray) {
        val ws = webSocket ?: return
        val base64 = Base64.encodeToString(pcmBytes, Base64.NO_WRAP)

        val payload = JsonObject().apply {
            val realtimeInput = JsonObject().apply {
                val mediaChunks = JsonArray().apply {
                    val chunk = JsonObject().apply {
                        addProperty("mimeType", "audio/pcm;rate=16000")
                        addProperty("data", base64)
                    }
                    add(chunk)
                }
                add("mediaChunks", mediaChunks)
            }
            add("realtimeInput", realtimeInput)
        }

        ws.send(gson.toJson(payload))
    }

    /**
     * Streams visual real-time screen inspection frame to Gemini Live.
     */
    fun sendVisualFrame(jpegBytes: ByteArray) {
        val ws = webSocket ?: return
        val base64 = Base64.encodeToString(jpegBytes, Base64.NO_WRAP)

        val payload = JsonObject().apply {
            val realtimeInput = JsonObject().apply {
                val mediaChunks = JsonArray().apply {
                    val chunk = JsonObject().apply {
                        addProperty("mimeType", "image/jpeg")
                        addProperty("data", base64)
                    }
                    add(chunk)
                }
                add("mediaChunks", mediaChunks)
            }
            add("realtimeInput", realtimeInput)
        }

        ws.send(gson.toJson(payload))
    }

    /**
     * Sends user text prompt into the live conversation turn.
     */
    fun sendTextMessage(text: String) {
        val ws = webSocket ?: return
        val payload = JsonObject().apply {
            val clientContent = JsonObject().apply {
                val turns = JsonArray().apply {
                    val turn = JsonObject().apply {
                        addProperty("role", "user")
                        val parts = JsonArray().apply {
                            val part = JsonObject().apply { addProperty("text", text) }
                            add(part)
                        }
                        add("parts", parts)
                    }
                    add(turn)
                }
                add("turns", turns)
                addProperty("turnComplete", true)
            }
            add("clientContent", clientContent)
        }
        ws.send(gson.toJson(payload))
    }

    fun sendToolResponse(callId: String, result: String) {
        val ws = webSocket ?: return
        val payload = JsonObject().apply {
            val toolResponse = JsonObject().apply {
                val fResponses = JsonArray().apply {
                    val resp = JsonObject().apply {
                        addProperty("id", callId)
                        val respObj = JsonObject().apply { addProperty("output", result) }
                        add("response", respObj)
                    }
                    add(resp)
                }
                add("functionResponses", fResponses)
            }
            add("toolResponse", toolResponse)
        }
        ws.send(gson.toJson(payload))
    }

    /**
     * Interrupts current speech output immediately, flushing audio buffer.
     */
    fun interrupt() {
        audioQueue.clear()
        try {
            audioTrack?.pause()
            audioTrack?.flush()
            audioTrack?.play()
        } catch (e: Exception) {
            Log.e(TAG, "Error flushing AudioTrack on interruption: ${e.message}")
        }
    }

    private fun stopAudioCaptureAndPlayback() {
        isRecording = false
        recordingJob?.cancel()
        recordingJob = null
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {}
        audioRecord = null

        isPlaying = false
        audioQueue.clear()
        playbackThread?.interrupt()
        playbackThread = null
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (e: Exception) {}
        audioTrack = null
    }

    fun stopSession() {
        isClosedManually = true
        stopAudioCaptureAndPlayback()
        try {
            webSocket?.close(1000, "User stopped session")
        } catch (e: Exception) {}
        webSocket = null
        _isLiveConnected.value = false
        wakeLock?.release()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, BongoLiveApp.CHANNEL_LIVE_VOICE)
            .setContentTitle("BongoLive Gemini Live সচল")
            .setContentText("ফুল ডুপ্লেক্স রিয়েল-টাইম বাংলা ভয়েস ও স্ক্রিন সংযোগ সক্রিয়...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onDestroy() {
        super.onDestroy()
        stopSession()
        serviceScope.cancel()
        instance = null
    }

    companion object {
        private const val TAG = "GeminiLiveService"
        const val NOTIFICATION_ID = 1004

        const val EXTRA_API_KEY = "extra_api_key"
        const val EXTRA_VOICE = "extra_voice"
        const val EXTRA_MODEL = "extra_model"
        const val EXTRA_INSTRUCTION = "extra_instruction"

        var instance: GeminiLiveService? = null
            private set
    }
}
