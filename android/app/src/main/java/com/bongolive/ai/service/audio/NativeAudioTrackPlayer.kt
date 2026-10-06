package com.bongolive.ai.service.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.os.Build
import android.util.Log
import java.util.concurrent.ConcurrentLinkedQueue

class NativeAudioTrackPlayer {

    private val sampleRate = 24000 // Gemini Live standard output sample rate
    private val channelConfig = AudioFormat.CHANNEL_OUT_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT

    private var audioTrack: AudioTrack? = null
    private val audioQueue = ConcurrentLinkedQueue<ByteArray>()
    @Volatile
    private var isPlaying = false
    private var playbackThread: Thread? = null

    fun initialize() {
        if (audioTrack != null) return

        val minBufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        val bufferSize = maxOf(minBufferSize, 4096)

        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()

        val format = AudioFormat.Builder()
            .setSampleRate(sampleRate)
            .setChannelMask(channelConfig)
            .setEncoding(audioFormat)
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

    fun playAudioChunk(pcmBytes: ByteArray) {
        if (audioTrack == null) {
            initialize()
        }
        audioQueue.add(pcmBytes)
    }

    fun flushAndInterrupt() {
        // Drop any buffered assistant speech when interrupted by user
        audioQueue.clear()
        try {
            audioTrack?.pause()
            audioTrack?.flush()
            audioTrack?.play()
        } catch (e: Exception) {
            Log.e("AudioTrackPlayer", "Error flushing audio track: ${e.message}")
        }
    }

    fun release() {
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
}
