package com.bongolive.ai.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.bongolive.ai.BongoLiveApp
import com.bongolive.ai.MainActivity
import com.bongolive.ai.data.remote.GeminiLiveWebSocketClient
import com.bongolive.ai.data.remote.LiveEvent
import com.bongolive.ai.service.audio.NativeAudioRecorder
import com.bongolive.ai.service.audio.NativeAudioTrackPlayer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LiveVoiceForegroundService : Service() {

    private val binder = LocalBinder()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val liveWsClient = GeminiLiveWebSocketClient()
    private val audioTrackPlayer = NativeAudioTrackPlayer()
    private lateinit var audioRecorder: NativeAudioRecorder

    private val _isLiveConnected = MutableStateFlow(false)
    val isLiveConnected = _isLiveConnected.asStateFlow()

    private val _currentAssistantCaption = MutableStateFlow("")
    val currentAssistantCaption = _currentAssistantCaption.asStateFlow()

    private val _currentUserCaption = MutableStateFlow("")
    val currentUserCaption = _currentUserCaption.asStateFlow()

    inner class LocalBinder : Binder() {
        fun getService(): LiveVoiceForegroundService = this@LiveVoiceForegroundService
    }

    override fun onCreate() {
        super.onCreate()

        audioRecorder = NativeAudioRecorder { pcmChunk ->
            liveWsClient.sendAudioChunk(pcmChunk)
        }

        // Listen for live events
        serviceScope.launch {
            liveWsClient.liveEvents.collect { event ->
                when (event) {
                    is LiveEvent.Connected -> {
                        _isLiveConnected.value = true
                        audioRecorder.startRecording(serviceScope)
                        audioTrackPlayer.initialize()
                    }
                    is LiveEvent.Disconnected -> {
                        _isLiveConnected.value = false
                        audioRecorder.stopRecording()
                    }
                    is LiveEvent.AudioData -> {
                        audioTrackPlayer.playAudioChunk(event.pcmBytes)
                    }
                    is LiveEvent.Caption -> {
                        if (event.speaker == "assistant") {
                            _currentAssistantCaption.value = event.text
                        } else {
                            _currentUserCaption.value = event.text
                        }
                    }
                    is LiveEvent.InterimCaption -> {
                        _currentUserCaption.value = event.text
                    }
                    is LiveEvent.Interrupted -> {
                        audioTrackPlayer.flushAndInterrupt()
                    }
                    is LiveEvent.ToolCall -> {
                        // Forward tool response
                        liveWsClient.sendToolResponse(event.callId, "executed")
                    }
                    is LiveEvent.Error -> {
                        // Error event
                    }
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)

        val apiKey = intent?.getStringExtra("API_KEY") ?: ""
        val wsUrl = intent?.getStringExtra("WS_URL") ?: "ws://10.0.2.2:3000/api/live-ws"
        val voice = intent?.getStringExtra("VOICE") ?: "Kore"

        liveWsClient.connect(wsUrl, apiKey, voice = voice)

        return START_NOT_STICKY
    }

    fun stopSession() {
        audioRecorder.stopRecording()
        audioTrackPlayer.release()
        liveWsClient.disconnect()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    fun interruptSpeech() {
        audioTrackPlayer.flushAndInterrupt()
        liveWsClient.interrupt()
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, BongoLiveApp.CHANNEL_LIVE_VOICE)
            .setContentTitle("BongoLive AI লাইভ সচল")
            .setContentText("বাংলা রিয়েল-টাইম ভয়েস সহকারী আপনার কথা শুনছে...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onDestroy() {
        super.onDestroy()
        audioRecorder.stopRecording()
        audioTrackPlayer.release()
        liveWsClient.disconnect()
        serviceScope.cancel()
    }

    companion object {
        const val NOTIFICATION_ID = 1001
    }
}
