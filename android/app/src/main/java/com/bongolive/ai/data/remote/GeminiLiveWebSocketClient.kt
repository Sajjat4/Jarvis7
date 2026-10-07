package com.bongolive.ai.data.remote

import android.util.Base64
import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import java.util.concurrent.TimeUnit

sealed class LiveEvent {
    object Connected : LiveEvent()
    object Disconnected : LiveEvent()
    object Interrupted : LiveEvent()
    data class AudioData(val pcmBytes: ByteArray) : LiveEvent()
    data class Caption(val speaker: String, val text: String, val finished: Boolean) : LiveEvent()
    data class InterimCaption(val speaker: String, val text: String) : LiveEvent()
    data class ToolCall(val callId: String, val name: String, val args: JsonObject) : LiveEvent()
    data class Error(val message: String) : LiveEvent()
}

class GeminiLiveWebSocketClient {

    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .connectTimeout(15, TimeUnit.SECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isClosedManually = false
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 3

    private var currentApiKey: String = ""
    private var currentModel: String = "gemini-2.0-flash-exp"
    private var currentVoice: String = "Kore"
    private var currentInstruction: String = ""
    private var currentEndpointUrl: String? = null

    private val _connectionState = MutableStateFlow(false)
    val connectionState = _connectionState.asStateFlow()

    private val _liveEvents = MutableSharedFlow<LiveEvent>()
    val liveEvents = _liveEvents.asSharedFlow()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * Connects directly to Google Gemini Live API or custom WebSocket endpoint.
     */
    fun connect(
        apiKey: String,
        model: String = "gemini-2.0-flash-exp",
        voice: String = "Kore",
        systemInstruction: String = "আপনি 'MYRA (মায়রা)' - একজন ইউনিভার্সাল অটোনোমাস এআই সহকারী।",
        customEndpoint: String? = null
    ) {
        disconnect()
        isClosedManually = false
        currentApiKey = apiKey
        currentModel = model
        currentVoice = voice
        currentInstruction = systemInstruction
        currentEndpointUrl = customEndpoint

        val wsUrl = if (!customEndpoint.isNullOrBlank()) {
            customEndpoint
        } else {
            // Direct Official Gemini Live WebSocket endpoint
            val normalizedModel = if (model.startsWith("models/")) model else "models/$model"
            "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=$apiKey"
        }

        val request = Request.Builder()
            .url(wsUrl)
            .addHeader("User-Agent", "BongoLive-Android-Native")
            .build()

        webSocket = client.newWebSocket(request, createWebSocketListener(isDirectGemini = customEndpoint.isNullOrBlank()))
    }

    private fun createWebSocketListener(isDirectGemini: Boolean) = object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            Log.d(TAG, "WebSocket connected successfully (isDirectGemini: $isDirectGemini)")
            _connectionState.value = true
            reconnectAttempts = 0
            scope.launch { _liveEvents.emit(LiveEvent.Connected) }

            if (isDirectGemini) {
                sendDirectGeminiSetupMessage(webSocket)
            } else {
                // Custom proxy setup protocol
                val initMsg = JsonObject().apply {
                    addProperty("type", "init")
                    addProperty("apiKey", currentApiKey)
                    addProperty("model", currentModel)
                    addProperty("voice", currentVoice)
                    addProperty("systemInstruction", currentInstruction)
                }
                webSocket.send(gson.toJson(initMsg))
            }
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            handleIncomingMessage(text, isDirectGemini)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            Log.e(TAG, "WebSocket failure: ${t.message}")
            _connectionState.value = false
            scope.launch {
                _liveEvents.emit(LiveEvent.Error(t.message ?: "সংযোগ বিচ্ছিন্ন হয়েছে"))
                _liveEvents.emit(LiveEvent.Disconnected)
            }
            attemptReconnect()
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            Log.d(TAG, "WebSocket closed code=$code, reason=$reason")
            _connectionState.value = false
            scope.launch { _liveEvents.emit(LiveEvent.Disconnected) }
            if (!isClosedManually) {
                attemptReconnect()
            }
        }
    }

    private fun sendDirectGeminiSetupMessage(ws: WebSocket) {
        val setupPayload = JsonObject().apply {
            val setupObj = JsonObject().apply {
                val modelName = if (currentModel.startsWith("models/")) currentModel else "models/$currentModel"
                addProperty("model", modelName)

                // Generation Config with Speech & Audio Modality
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

                // System Instruction
                if (currentInstruction.isNotBlank()) {
                    val sysInst = JsonObject().apply {
                        val partsArr = JsonArray().apply {
                            val part = JsonObject().apply {
                                addProperty("text", currentInstruction)
                            }
                            add(part)
                        }
                        add("parts", partsArr)
                    }
                    add("systemInstruction", sysInst)
                }
            }
            add("setup", setupObj)
        }

        val jsonString = gson.toJson(setupPayload)
        Log.d(TAG, "Sending direct Gemini setup: $jsonString")
        ws.send(jsonString)
    }

    private fun handleIncomingMessage(text: String, isDirectGemini: Boolean) {
        try {
            val json = gson.fromJson(text, JsonObject::class.java)

            if (isDirectGemini) {
                // Official Gemini Live protocol parser
                if (json.has("serverContent")) {
                    val sc = json.getAsJsonObject("serverContent")

                    // Interruption
                    if (sc.has("interrupted") && sc.get("interrupted").asBoolean) {
                        scope.launch { _liveEvents.emit(LiveEvent.Interrupted) }
                    }

                    // Model Turn Parts
                    if (sc.has("modelTurn")) {
                        val modelTurn = sc.getAsJsonObject("modelTurn")
                        val parts = modelTurn.getAsJsonArray("parts")
                        if (parts != null) {
                            for (p in parts) {
                                val partObj = p.asJsonObject
                                if (partObj.has("inlineData")) {
                                    val inlineData = partObj.getAsJsonObject("inlineData")
                                    val base64 = inlineData.get("data")?.asString
                                    if (base64 != null) {
                                        val pcmBytes = Base64.decode(base64, Base64.NO_WRAP)
                                        scope.launch { _liveEvents.emit(LiveEvent.AudioData(pcmBytes)) }
                                    }
                                }
                                if (partObj.has("text")) {
                                    val chunkText = partObj.get("text").asString
                                    scope.launch { _liveEvents.emit(LiveEvent.Caption("assistant", chunkText, false)) }
                                }
                            }
                        }
                    }

                    // Output Transcription
                    if (sc.has("outputTranscription")) {
                        val ot = sc.getAsJsonObject("outputTranscription")
                        val otText = ot.get("text")?.asString
                        if (!otText.isNullOrBlank()) {
                            val finished = ot.get("finished")?.asBoolean ?: false
                            scope.launch { _liveEvents.emit(LiveEvent.Caption("assistant", otText, finished)) }
                        }
                    }

                    // Input Transcription
                    if (sc.has("inputTranscription")) {
                        val itObj = sc.getAsJsonObject("inputTranscription")
                        val itText = itObj.get("text")?.asString
                        if (!itText.isNullOrBlank()) {
                            val finished = itObj.get("finished")?.asBoolean ?: false
                            scope.launch { _liveEvents.emit(LiveEvent.Caption("user", itText, finished)) }
                        }
                    }
                }

                // Tool Call
                if (json.has("toolCall")) {
                    val tc = json.getAsJsonObject("toolCall")
                    val fCalls = tc.getAsJsonArray("functionCalls")
                    if (fCalls != null) {
                        for (fc in fCalls) {
                            val fcObj = fc.asJsonObject
                            val callId = fcObj.get("id")?.asString ?: ""
                            val name = fcObj.get("name")?.asString ?: ""
                            val args = fcObj.getAsJsonObject("args") ?: JsonObject()
                            scope.launch { _liveEvents.emit(LiveEvent.ToolCall(callId, name, args)) }
                        }
                    }
                }
            } else {
                // Custom proxy schema
                val type = json.get("type")?.asString ?: return
                when (type) {
                    "audio" -> {
                        val base64 = json.get("data")?.asString ?: return
                        val pcmBytes = Base64.decode(base64, Base64.NO_WRAP)
                        scope.launch { _liveEvents.emit(LiveEvent.AudioData(pcmBytes)) }
                    }
                    "caption" -> {
                        val speaker = json.get("speaker")?.asString ?: "assistant"
                        val captionText = json.get("text")?.asString ?: ""
                        val finished = json.get("finished")?.asBoolean ?: false
                        scope.launch { _liveEvents.emit(LiveEvent.Caption(speaker, captionText, finished)) }
                    }
                    "interrupted" -> {
                        scope.launch { _liveEvents.emit(LiveEvent.Interrupted) }
                    }
                    "tool_call" -> {
                        val callId = json.get("callId")?.asString ?: ""
                        val name = json.get("name")?.asString ?: ""
                        val args = json.getAsJsonObject("args") ?: JsonObject()
                        scope.launch { _liveEvents.emit(LiveEvent.ToolCall(callId, name, args)) }
                    }
                    "error" -> {
                        val err = json.get("error")?.asString ?: "Error"
                        scope.launch { _liveEvents.emit(LiveEvent.Error(err)) }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing incoming live message: ${e.message}")
        }
    }

    /**
     * Streams real-time 16kHz PCM audio chunk to Gemini Live.
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
     * Streams visual screen frame to Gemini Live for multimodal inspection.
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
     * Sends user text turn into the active live session.
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
                        val respObj = JsonObject().apply {
                            addProperty("output", result)
                        }
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

    fun interrupt() {
        // Immediate client-side interruption
        scope.launch { _liveEvents.emit(LiveEvent.Interrupted) }
    }

    private fun attemptReconnect() {
        if (isClosedManually || reconnectAttempts >= maxReconnectAttempts) return
        reconnectAttempts++
        val delayMs = 1500L * reconnectAttempts
        Log.d(TAG, "Attempting reconnect in ${delayMs}ms (attempt $reconnectAttempts/$maxReconnectAttempts)")
        scope.launch {
            delay(delayMs)
            if (!isClosedManually && !_connectionState.value && currentApiKey.isNotBlank()) {
                connect(currentApiKey, currentModel, currentVoice, currentInstruction, currentEndpointUrl)
            }
        }
    }

    fun disconnect() {
        isClosedManually = true
        try {
            webSocket?.close(1000, "User disconnected")
        } catch (e: Exception) {}
        webSocket = null
        _connectionState.value = false
    }

    companion object {
        private const val TAG = "GeminiLiveWS"
    }
}
