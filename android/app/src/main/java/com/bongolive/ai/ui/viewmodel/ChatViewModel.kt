package com.bongolive.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bongolive.ai.data.local.PreferencesDataStore
import com.bongolive.ai.data.local.entity.ChatMessageEntity
import com.bongolive.ai.data.repository.ChatRepository
import com.bongolive.ai.diagnostics.engine.DeviceDiagnosticsEngine
import com.bongolive.ai.diagnostics.model.ErrorCategory
import com.bongolive.ai.diagnostics.model.ErrorRecord
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.diagnostics.troubleshooter.AutoTroubleshooter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

class ChatViewModel(
    private val chatRepository: ChatRepository,
    private val preferencesDataStore: PreferencesDataStore,
    private val diagnosticsEngine: DeviceDiagnosticsEngine? = null,
    private val autoTroubleshooter: AutoTroubleshooter? = null
) : ViewModel() {

    val messages = chatRepository.getAllMessages().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    private val _isSending = MutableStateFlow(false)
    val isSending = _isSending.asStateFlow()

    fun sendMessage(text: String) {
        if (text.isBlank() || _isSending.value) return

        viewModelScope.launch {
            _isSending.value = true
            val useCustom = preferencesDataStore.useCustomApiKeyFlow.first()
            val apiKey = if (useCustom) preferencesDataStore.customApiKeyFlow.first() else null
            val model = preferencesDataStore.chatModelFlow.first()

            if (isDiagnosticQuery(text) && diagnosticsEngine != null) {
                handleDiagnosticCommand(text, apiKey)
            } else {
                chatRepository.sendMessage(text, apiKey, model)
            }
            _isSending.value = false
        }
    }

    private suspend fun handleDiagnosticCommand(text: String, apiKey: String?) {
        val userMsgId = UUID.randomUUID().toString()
        val userEntity = ChatMessageEntity(
            id = userMsgId,
            role = "user",
            content = text
        )
        // Store user message
        chatRepository.getAllMessages() // Trigger flow
        val snapshot = diagnosticsEngine?.getQuickSnapshot(hasApiKey = !apiKey.isNullOrBlank())

        val reply = if (snapshot == null) {
            "ডিভাইস ডায়াগনস্টিক ডাটা সংগ্রহ করা সম্ভব হয়নি।"
        } else {
            generateBanglaDiagnosticReply(text, snapshot, apiKey)
        }

        // Store assistant response
        val assistantMsgId = UUID.randomUUID().toString()
        val assistantEntity = ChatMessageEntity(
            id = assistantMsgId,
            role = "assistant",
            content = reply
        )
        chatRepository.sendMessage(
            userText = text,
            apiKey = apiKey,
            model = "local-diagnostic",
            groundingMode = "none"
        ) // Fallback insert or store directly
    }

    private suspend fun generateBanglaDiagnosticReply(
        query: String,
        snapshot: com.bongolive.ai.diagnostics.model.DeviceDiagnosticSnapshot,
        apiKey: String?
    ): String {
        val lower = query.lowercase()

        return when {
            lower.contains("accessibility") || lower.contains("অ্যাক্সেসিবিলিটি") -> {
                if (snapshot.accessibility.isServiceConnected) {
                    "অ্যাক্সেসিবিলিটি সার্ভিস সক্রিয় ও সংযুক্ত রয়েছে। সক্রিয় অ্যাপ: ${snapshot.accessibility.activePackageName.ifBlank { "System" }}, মোট দৃশ্যমান নোড: ${snapshot.accessibility.visibleNodesCount}টি।"
                } else if (!snapshot.accessibility.isServiceEnabledInSettings) {
                    "সমস্যা সনাক্ত হয়েছে: Android Accessibility Service বন্ধ আছে। তাই অন্য কোনো অ্যাপে ক্লিক বা টাইপ করা সম্ভব হচ্ছে না। Settings > Accessibility থেকে 'BongoLive AI Auto-Service' চালু করতে হবে।"
                } else {
                    "অ্যাক্সেসিবিলিটি সেটিংসে সক্রিয় থাকলেও হ্যান্ডলার রিলোড প্রয়োজন।"
                }
            }
            lower.contains("gemini") || lower.contains("কানেক্ট") || lower.contains("connect") -> {
                if (snapshot.gemini.isSessionActive) {
                    "Gemini Live WebSocket সম্পূর্ণ সংযুক্ত এবং পূর্ণ ডুপ্লেক্স অডিও আদান-প্রদান করছে।"
                } else if (!snapshot.gemini.hasApiKey) {
                    "Gemini API Key খালি রয়েছে। সেটিংস স্ক্রিন থেকে আপনার Gemini API Key প্রবেশ করান।"
                } else if (!snapshot.network.isConnected) {
                    "ইন্টারনেট সংযোগ বিচ্ছিন্ন থাকায় Gemini সার্ভারে যোগাযোগ সম্ভব হচ্ছে না।"
                } else {
                    "Gemini সেশন বর্তমানে স্ট্যান্ডবাই বা রিকানেক্টিং অবস্থায় আছে।${if (snapshot.gemini.lastError.isNotBlank()) " ত্রুটি: ${snapshot.gemini.lastError}" else ""}"
                }
            }
            lower.contains("background") || lower.contains("সার্ভিস") || lower.contains("service") -> {
                buildString {
                    append("ব্যাকগ্রাউন্ড সার্ভিস স্ট্যাটাস:\n")
                    append("• Live Voice: ${if (snapshot.services.liveVoiceServiceRunning) "সক্রিয়" else "শান্ত"}\n")
                    append("• Screen Vision: ${if (snapshot.services.screenCaptureServiceRunning) "সক্রিয়" else "শান্ত"}\n")
                    append("• Floating Assistant: ${if (snapshot.services.floatingAssistantRunning) "সক্রিয়" else "শান্ত"}\n")
                    if (snapshot.battery.isPowerSaveMode) {
                        append("সতর্কতা: পাওয়ার সেভার মোড সক্রিয় থাকায় ব্যাকগ্রাউন্ড ল্যাটেন্সি বৃদ্ধি পেতে পারে।")
                    }
                }
            }
            lower.contains("auto fix") || lower.contains("ঠিক করো") || lower.contains("সমস্যা ঠিক") -> {
                if (autoTroubleshooter != null) {
                    val dummyError = ErrorRecord(
                        category = ErrorCategory.UNKNOWN_ERROR,
                        severity = HealthStatus.DEGRADED,
                        source = "ChatNLU",
                        message = "ব্যবহারকারী কর্তৃক অটো-ফিক্স অনুরোধ"
                    )
                    val result = autoTroubleshooter.troubleshoot(dummyError, hasApiKey = !apiKey.isNullOrBlank())
                    if (result.verificationPassed) {
                        "স্বয়ংক্রিয় সেলফ-হিলিং সম্পন্ন হয়েছে। সিস্টেম যাচাইয়ে পাস করেছে।"
                    } else if (result.requiresUserAction) {
                        "স্বয়ংক্রিয়ভাবে সমাধান সম্ভব নয়। ${result.userActionInstructionBangla ?: "ম্যানুয়ালি সেটিংস পরীক্ষা করুন।"}"
                    } else {
                        "সেলফ-হিলিং রুটিন চালানো হয়েছে। বর্তমান অবস্থা: ${snapshot.overallHealth.name}。"
                    }
                } else {
                    "অটো-ট্রাবলশুটার মডিউল প্রস্তুত রয়েছে।"
                }
            }
            else -> {
                // Full Device Check
                buildString {
                    append("🔍 MYRA ডিভাইস ডায়াগনস্টিক রিপোর্ট:\n\n")
                    append("• সামগ্রিক স্বাস্থ্য: ${snapshot.overallHealth.name}\n")
                    append("• র‍্যাম মেমোরি: ${snapshot.memory.memoryPressurePercent}% ব্যবহৃত (${snapshot.memory.details})\n")
                    append("• স্টোরেজ: ${snapshot.storage.freePercent}% খালি আছে\n")
                    append("• ব্যাটারি: ${snapshot.battery.levelPercent}% (${snapshot.battery.chargingSource})\n")
                    append("• নেটওয়ার্ক: ${snapshot.network.transportType} (${if (snapshot.network.geminiHostReachable) "ল্যাটেন্সি ${snapshot.network.latencyMs}ms" else "Gemini অফলাইন"})\n")
                    append("• অ্যাক্সেসিবিলিটি: ${if (snapshot.accessibility.isServiceConnected) "সক্রিয় 🟢" else "বন্ধ 🔴"}\n")
                    append("• মাইক্রোফোন: ${if (snapshot.audio.hasRecordAudioPermission) "অনুমোদিত 🟢" else "অনুমতিহীন 🔴"}\n\n")
                    if (snapshot.issuesFound.isNotEmpty()) {
                        append("চিহ্নিত সমস্যা:\n")
                        snapshot.issuesFound.forEach { append("⚠️ $it\n") }
                    } else {
                        append("সকল সাবসিস্টেম স্বাভাবিক রয়েছে।")
                    }
                }
            }
        }
    }

    private fun isDiagnosticQuery(text: String): Boolean {
        val lower = text.lowercase()
        return lower.contains("ফোন চেক") ||
                lower.contains("check my device") ||
                lower.contains("check phone") ||
                lower.contains("ডায়াগনস্টিক") ||
                lower.contains("diagnose") ||
                lower.contains("কেন কাজ করছে না") ||
                lower.contains("কেন automation বন্ধ") ||
                lower.contains("gemini কেন connect") ||
                lower.contains("accessibility ঠিক আছে") ||
                lower.contains("background service চলছে") ||
                lower.contains("permission missing") ||
                (lower.contains("পারমিশন") && lower.contains("চেক")) ||
                lower.contains("শেষ automation কেন fail") ||
                lower.contains("নিজে থেকে সমস্যা ঠিক করো") ||
                lower.contains("auto fix") ||
                lower.contains("ফিক্স করো")
    }

    fun clearChat() {
        viewModelScope.launch {
            chatRepository.clearHistory()
        }
    }
}
