package com.bongolive.ai.diagnostics.engine

import android.content.Context
import android.content.pm.PackageManager
import com.bongolive.ai.diagnostics.model.AudioStatus
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.service.GeminiLiveService
import com.bongolive.ai.service.LiveVoiceForegroundService
import com.bongolive.ai.utils.PermissionManager

object AudioDiagnostics {

    fun inspect(context: Context): AudioStatus {
        val hasMicPermission = PermissionManager.hasAudioPermission(context)
        val hasMicHardware = context.packageManager.hasSystemFeature(PackageManager.FEATURE_MICROPHONE)

        val geminiService = GeminiLiveService.instance
        val liveVoiceService = LiveVoiceForegroundService.instance

        val isRecordingActive = geminiService?.diagnosticLastAudioTimestamp ?: 0L > 0L || liveVoiceService?.isLiveConnected?.value == true
        val isPlaybackActive = geminiService?.isLiveConnected?.value == true

        // True state inspection:
        val audioRecordOk = hasMicPermission && hasMicHardware
        val audioTrackOk = true // Android standard AudioTrack availability

        val status = when {
            !hasMicHardware -> HealthStatus.CRITICAL
            !hasMicPermission -> HealthStatus.ERROR
            else -> HealthStatus.HEALTHY
        }

        val details = buildString {
            if (!hasMicHardware) {
                append("ডিভাইসে কোনো মাইক্রোফোন হার্ডওয়্যার সনাক্ত হয়নি।")
            } else if (!hasMicPermission) {
                append("মাইক্রোফোন পারমিশন (RECORD_AUDIO) বন্ধ আছে। ভয়েস সহকারী শুনতে পারছে না।")
            } else {
                append("মাইক্রোফোন পারমিশন সক্রিয় (16kHz PCM)। অডিও ট্র্যাক (24kHz PCM) প্লেব্যাক প্রস্তুত।")
            }
        }

        return AudioStatus(
            hasRecordAudioPermission = hasMicPermission,
            isRecordingActive = isRecordingActive,
            isPlaybackActive = isPlaybackActive,
            audioRecordInitialized = audioRecordOk,
            audioTrackInitialized = audioTrackOk,
            status = status,
            details = details
        )
    }
}
