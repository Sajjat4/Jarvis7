package com.bongolive.ai.diagnostics.engine

import android.content.Context
import com.bongolive.ai.diagnostics.model.GeminiConnectionStatus
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.service.GeminiLiveService
import com.bongolive.ai.service.LiveVoiceForegroundService

object GeminiDiagnostics {

    fun inspect(hasApiKeyConfigured: Boolean): GeminiConnectionStatus {
        val geminiService = GeminiLiveService.instance
        val liveVoiceService = LiveVoiceForegroundService.instance

        val isServiceRunning = geminiService != null || liveVoiceService != null
        val isConnected = geminiService?.isLiveConnected?.value == true || liveVoiceService?.isLiveConnected?.value == true

        val lastError = geminiService?.diagnosticLastError ?: ""
        val lastConnectTime = geminiService?.diagnosticLastConnectedTimestamp ?: 0L
        val lastMsgTime = geminiService?.diagnosticLastMessageTimestamp ?: 0L
        val lastAudioTime = geminiService?.diagnosticLastAudioTimestamp ?: 0L
        val reconnectAttempts = geminiService?.diagnosticReconnectCount ?: 0

        val connectionState = when {
            isConnected -> "CONNECTED"
            !isServiceRunning -> "IDLE (Not Running)"
            lastError.isNotBlank() -> "ERROR"
            else -> "DISCONNECTED"
        }

        val status = when {
            isConnected -> HealthStatus.HEALTHY
            !hasApiKeyConfigured -> HealthStatus.ERROR
            lastError.contains("API key", ignoreCase = true) || lastError.contains("403", ignoreCase = true) -> HealthStatus.ERROR
            lastError.isNotBlank() -> HealthStatus.DEGRADED
            isServiceRunning && !isConnected -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY // Idle when user hasn't started session
        }

        val details = buildString {
            if (!hasApiKeyConfigured) {
                append("Gemini API Key কনফিগার করা নেই। Settings এ গিয়ে আপনার API key যুক্ত করুন।")
            } else if (isConnected) {
                append("Gemini Live WebSocket সংযুক্ত ও সক্রিয়। পূর্ণ ডুপ্লেক্স অডিও স্ট্রিমিং প্রস্তুত।")
            } else if (isServiceRunning) {
                append("সার্ভিস রানিং কিন্তু সংযোগ বিচ্ছিন্ন।")
                if (lastError.isNotBlank()) append(" ত্রুটি: $lastError")
            } else {
                append("Gemini Live বর্তমানে নিষ্ক্রিয় (প্রয়োজনে স্বয়ংক্রিয়ভাবে সংযুক্ত হবে)।")
            }
        }

        return GeminiConnectionStatus(
            connectionState = connectionState,
            isSessionActive = isConnected,
            hasApiKey = hasApiKeyConfigured,
            lastConnectedTimestamp = lastConnectTime,
            lastMessageTimestamp = lastMsgTime,
            lastAudioChunkTimestamp = lastAudioTime,
            reconnectAttempts = reconnectAttempts,
            lastError = lastError,
            status = status,
            details = details
        )
    }
}
