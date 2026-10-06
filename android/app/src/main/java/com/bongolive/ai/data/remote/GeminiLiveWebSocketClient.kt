package com.bongolive.ai.data.remote

import android.util.Base64
import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
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
        .build()

    private var webSocket: WebSocket? = null

    private val _connectionState = MutableStateFlow(false)
    val connectionState = _connectionState.asStateFlow()

    private val _liveEvents = MutableSharedFlow<LiveEvent>()
    val liveEvents = _liveEvents.asSharedFlow()

    private val scope = CoroutineScope(Dispatchers.IO)

    fun connect(wsUrl: String, apiKey: String, model: String = "gemini-3.8-live", voice: String = "Kore") {
        disconnect()

        val request = Request.Builder().url(wsUrl).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d("GeminiLiveWS", "WebSocket connected, sending init")
                _connectionState.value = true
                scope.launch { _liveEvents.emit(LiveEvent.Connected) }

                // Send initialization message
                val initMsg = JsonObject().apply {
                    addProperty("type", "init")
                    addProperty("apiKey", apiKey)
                    addProperty("model", model)
                    addProperty("voice", voice)
                }
                webSocket.send(gson.toJson(initMsg))
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val json = gson.fromJson(text, JsonObject::class.java)
                    val type = json.get("type")?.asString ?: return

                    when (type) {
                        "ready" -> {
                            Log.d("GeminiLiveWS", "Gemini Live session initialized ready")
                        }
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
                        "interim_caption" -> {
                            val speaker = json.get("speaker")?.asString ?: "user"
                            val captionText = json.get("text")?.asString ?: ""
                            scope.launch { _liveEvents.emit(LiveEvent.InterimCaption(speaker, captionText)) }
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
                            val err = json.get("error")?.asString ?: "Live API Error"
                            scope.launch { _liveEvents.emit(LiveEvent.Error(err)) }
                        }
                    }
                } catch (e: Exception) {
                    Log.e("GeminiLiveWS", "Error parsing live message: ${e.message}")
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("GeminiLiveWS", "WebSocket failure: ${t.message}")
                _connectionState.value = false
                scope.launch {
                    _liveEvents.emit(LiveEvent.Error(t.message ?: "কানেকশন ব্যাহত হয়েছে"))
                    _liveEvents.emit(LiveEvent.Disconnected)
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("GeminiLiveWS", "WebSocket closed: $reason")
                _connectionState.value = false
                scope.launch { _liveEvents.emit(LiveEvent.Disconnected) }
            }
        })
    }

    fun sendAudioChunk(pcmBytes: ByteArray) {
        val ws = webSocket ?: return
        val base64 = Base64.encodeToString(pcmBytes, Base64.NO_WRAP)
        val msg = JsonObject().apply {
            addProperty("type", "audio")
            addProperty("data", base64)
        }
        ws.send(gson.toJson(msg))
    }

    fun sendTextMessage(text: String) {
        val ws = webSocket ?: return
        val msg = JsonObject().apply {
            addProperty("type", "text")
            addProperty("text", text)
        }
        ws.send(gson.toJson(msg))
    }

    fun sendToolResponse(callId: String, result: String) {
        val ws = webSocket ?: return
        val msg = JsonObject().apply {
            addProperty("type", "tool_response")
            addProperty("callId", callId)
            addProperty("result", result)
        }
        ws.send(gson.toJson(msg))
    }

    fun interrupt() {
        val ws = webSocket ?: return
        val msg = JsonObject().apply {
            addProperty("type", "interrupt")
        }
        ws.send(gson.toJson(msg))
    }

    fun disconnect() {
        try {
            webSocket?.close(1000, "User disconnected")
        } catch (e: Exception) {}
        webSocket = null
        _connectionState.value = false
    }
}
