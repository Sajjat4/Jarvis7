package com.bongolive.ai.diagnostics.analyzer

import android.provider.Settings
import com.bongolive.ai.diagnostics.model.*

object RootCauseAnalyzer {

    data class AnalysisResult(
        val rootCause: RootCauseType,
        val explanationBangla: String,
        val evidenceBangla: String,
        val suggestedRecovery: RecoveryAction?
    )

    fun analyze(
        error: ErrorRecord,
        snapshot: DeviceDiagnosticSnapshot
    ): AnalysisResult {
        // 1. DETERMINISTIC NETWORK & GEMINI RULES
        if (error.category == ErrorCategory.NETWORK_ERROR || error.category == ErrorCategory.GEMINI_ERROR || error.category == ErrorCategory.TIMEOUT) {
            if (!snapshot.network.isConnected) {
                return AnalysisResult(
                    rootCause = RootCauseType.NETWORK_DISCONNECTED,
                    explanationBangla = "ডিভাইসে কোনো ইন্টারনেট কানেকশন নেই। ফলে Gemini এর সাথে যোগাযোগ সম্ভব হয়নি।",
                    evidenceBangla = "ConnectivityManager রিপোর্ট: ইন্টারনেট সক্রিয় নয়।",
                    suggestedRecovery = RecoveryAction(
                        type = "OPEN_WIFI_SETTINGS",
                        titleBangla = "নেটওয়ার্ক সেটিংস খুলুন",
                        descriptionBangla = "ওয়াই-ফাই বা মোবাইল ডাটা চালু করতে সেটিংস খুলুন।",
                        isSafeAutoFix = false,
                        intentAction = Settings.ACTION_WIRELESS_SETTINGS
                    )
                )
            }
            if (!snapshot.network.isValidatedInternet || !snapshot.network.geminiHostReachable) {
                return AnalysisResult(
                    rootCause = RootCauseType.NETWORK_UNVALIDATED,
                    explanationBangla = "ইন্টারনেট কানেক্টেড দেখালেও ডেটা ট্রাফিক অবরুদ্ধ বা DNS এ Gemini সার্ভার ব্লকড।",
                    evidenceBangla = "generativelanguage.googleapis.com:443 সংযোগ ব্যর্থ বা ক্যাপটিভ পোর্টাল।",
                    suggestedRecovery = RecoveryAction(
                        type = "RECONNECT_WS",
                        titleBangla = "Gemini পুনঃসংযোগ চেষ্টা",
                        descriptionBangla = "WebSocket সেশন নতুন করে শুরু করার চেষ্টা করা হবে।",
                        isSafeAutoFix = true
                    )
                )
            }
            if (!snapshot.gemini.hasApiKey) {
                return AnalysisResult(
                    rootCause = RootCauseType.GEMINI_API_KEY_MISSING,
                    explanationBangla = "Gemini API Key খালি বা সেট করা হয়নি।",
                    evidenceBangla = "Settings এ API key পাওয়া যায়নি।",
                    suggestedRecovery = RecoveryAction(
                        type = "NAVIGATE_SETTINGS",
                        titleBangla = "API Key যোগ করুন",
                        descriptionBangla = "সেটিংস স্ক্রিন খুলুন।",
                        isSafeAutoFix = false
                    )
                )
            }
            if (error.message.contains("403", ignoreCase = true) || error.message.contains("API key", ignoreCase = true)) {
                return AnalysisResult(
                    rootCause = RootCauseType.GEMINI_AUTH_INVALID,
                    explanationBangla = "Gemini API Key টি অবৈধ অথবা মেয়াদোত্তীর্ণ।",
                    evidenceBangla = "HTTP 403 Forbidden বা Auth Error পাওয়া গেছে।",
                    suggestedRecovery = RecoveryAction(
                        type = "NAVIGATE_SETTINGS",
                        titleBangla = "API Key আপডেট করুন",
                        descriptionBangla = "সঠিক Gemini API Key প্রদান করুন।",
                        isSafeAutoFix = false
                    )
                )
            }
        }

        // 2. DETERMINISTIC ACCESSIBILITY RULES
        if (error.category == ErrorCategory.ACCESSIBILITY_ERROR ||
            error.category == ErrorCategory.CLICK_FAILED ||
            error.category == ErrorCategory.TYPE_FAILED ||
            error.category == ErrorCategory.SCROLL_FAILED ||
            error.category == ErrorCategory.UI_TARGET_NOT_FOUND) {

            if (!snapshot.accessibility.isServiceEnabledInSettings) {
                return AnalysisResult(
                    rootCause = RootCauseType.ACCESSIBILITY_SERVICE_DISABLED,
                    explanationBangla = "Android Accessibility Service বন্ধ আছে। ফলে MYRA অন্য কোনো অ্যাপের স্ক্রিন স্পর্শ বা টাইপ করতে পারছে না।",
                    evidenceBangla = "Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES এ BongoLive অনুপস্থিত।",
                    suggestedRecovery = RecoveryAction(
                        type = "OPEN_ACCESSIBILITY_SETTINGS",
                        titleBangla = "Accessibility সেটিংস খুলুন",
                        descriptionBangla = "সেটিংস থেকে 'BongoLive AI Auto-Service' চালু করতে হবে।",
                        isSafeAutoFix = false,
                        intentAction = Settings.ACTION_ACCESSIBILITY_SETTINGS
                    )
                )
            }

            if (!snapshot.accessibility.isServiceConnected) {
                return AnalysisResult(
                    rootCause = RootCauseType.ACCESSIBILITY_NODE_UNRESPONSIVE,
                    explanationBangla = "Accessibility Service সেটিংসে অন থাকলেও সিস্টেম হ্যান্ডলার বিচ্ছিন্ন হয়েছে।",
                    evidenceBangla = "MyraAccessibilityService.instance নিষ্ক্রিয়।",
                    suggestedRecovery = RecoveryAction(
                        type = "REFRESH_ACCESSIBILITY",
                        titleBangla = "সার্ভিস রিফ্রেশ",
                        descriptionBangla = "সিস্টেম নোড ট্রাভার্সাল রিলোড করা হচ্ছে।",
                        isSafeAutoFix = true
                    )
                )
            }

            if (error.category == ErrorCategory.CLICK_FAILED) {
                return AnalysisResult(
                    rootCause = RootCauseType.ACCESSIBILITY_CLICK_UNSUPPORTED,
                    explanationBangla = "নোডটি পাওয়া গেলেও ACTION_CLICK এক্সেপ্ট করেনি। বিকল্প হিসেবে জেসচার ট্যাপ চেষ্টা করা উচিত।",
                    evidenceBangla = "AccessibilityNodeInfo.performAction(ACTION_CLICK) false রিটার্ন করেছে।",
                    suggestedRecovery = RecoveryAction(
                        type = "FALLBACK_GESTURE_TAP",
                        titleBangla = "কোঅর্ডিনেট জেসচার ট্যাপ",
                        descriptionBangla = "নোডের বাউন্ডস সেন্টারে সরাসরি ডিসপ্যাচ জেসচার চালানো হবে।",
                        isSafeAutoFix = true
                    )
                )
            }

            if (error.category == ErrorCategory.UI_TARGET_NOT_FOUND) {
                return AnalysisResult(
                    rootCause = RootCauseType.ACCESSIBILITY_TARGET_NOT_FOUND,
                    explanationBangla = "অনুরোধকৃত বাটন বা টেক্সটটি বর্তমান স্ক্রিনে দৃশ্যমান নেই। পেজটি এখনো লোড হচ্ছে বা স্ক্রল করা প্রয়োজন।",
                    evidenceBangla = "বর্তমান স্ক্রিনের ${snapshot.accessibility.visibleNodesCount}টি নোডের কোনোটিতেই টার্গেট টেক্সট মেলেনি।",
                    suggestedRecovery = RecoveryAction(
                        type = "SCROLL_AND_RETRY",
                        titleBangla = "স্ক্রিন রিফ্রেশ ও স্ক্রল",
                        descriptionBangla = "স্ক্রিন নিচে নামিয়ে পুনরায় নোড বিশ্লেষণ করা হবে।",
                        isSafeAutoFix = true
                    )
                )
            }
        }

        // 3. DETERMINISTIC PERMISSION & MEDIA RULES
        if (error.category == ErrorCategory.SCREEN_CAPTURE_ERROR) {
            if (!snapshot.screenCapture.hasProjectionConsent) {
                return AnalysisResult(
                    rootCause = RootCauseType.MEDIA_PROJECTION_CONSENT_MISSING,
                    explanationBangla = "স্ক্রিন দেখার অনুমতি (MediaProjection) সক্রিয় নেই। Android ব্যবহারকারীর সরাসরি সম্মতি চায়।",
                    evidenceBangla = "ScreenCaptureService এ সক্রিয় ভার্চুয়াল ডিসপ্লে নেই।",
                    suggestedRecovery = RecoveryAction(
                        type = "REQUEST_SCREEN_CAPTURE",
                        titleBangla = "স্ক্রিন শেয়ার চালু করুন",
                        descriptionBangla = "সিস্টেম ডায়ালগে 'Start now' চাপুন।",
                        isSafeAutoFix = false
                    )
                )
            }
        }

        if (error.category == ErrorCategory.AUDIO_ERROR) {
            if (!snapshot.audio.hasRecordAudioPermission) {
                return AnalysisResult(
                    rootCause = RootCauseType.RECORD_AUDIO_PERMISSION_DENIED,
                    explanationBangla = "মাইক্রোফোন পারমিশন (RECORD_AUDIO) প্রত্যাখ্যাত।",
                    evidenceBangla = "PermissionManager.hasAudioPermission false।",
                    suggestedRecovery = RecoveryAction(
                        type = "OPEN_APP_PERMISSIONS",
                        titleBangla = "মাইক্রোফোন পারমিশন দিন",
                        descriptionBangla = "অ্যাপ সেটিংসে গিয়ে মাইক্রোফোন অন করুন।",
                        isSafeAutoFix = false,
                        intentAction = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                    )
                )
            }
        }

        if (error.category == ErrorCategory.OVERLAY_ERROR) {
            if (!snapshot.overlay.hasOverlayPermission) {
                return AnalysisResult(
                    rootCause = RootCauseType.OVERLAY_PERMISSION_DENIED,
                    explanationBangla = "অন্যান্য অ্যাপের উপরে প্রদর্শনের পারমিশন নেই।",
                    evidenceBangla = "Settings.canDrawOverlays false।",
                    suggestedRecovery = RecoveryAction(
                        type = "OPEN_OVERLAY_SETTINGS",
                        titleBangla = "ওভারলে পারমিশন অন করুন",
                        descriptionBangla = "সেটিংস থেকে 'Display over other apps' অনুমতি দিন।",
                        isSafeAutoFix = false,
                        intentAction = Settings.ACTION_MANAGE_OVERLAY_PERMISSION
                    )
                )
            }
        }

        // 4. LOW BATTERY / THERMAL / SYSTEM
        if (snapshot.battery.levelPercent <= 10 && !snapshot.battery.isCharging) {
            return AnalysisResult(
                rootCause = RootCauseType.BATTERY_CRITICALLY_LOW,
                explanationBangla = "ডিভাইসের ব্যাটারি মাত্র ${snapshot.battery.levelPercent}%। সিস্টেম পাওয়ার সেভিং প্রসেস বন্ধ করে দিতে পারে।",
                evidenceBangla = "BatteryManager স্তর সংকটাপন্ন।",
                suggestedRecovery = null
            )
        }

        if (snapshot.memory.isLowMemory) {
            return AnalysisResult(
                rootCause = RootCauseType.RAM_CRITICALLY_LOW,
                explanationBangla = "ডিভাইসের র‍্যাম অত্যন্ত সংকুচিত। Android ব্যাকগ্রাউন্ড সার্ভিস ও প্রসেস বন্ধ করছে।",
                evidenceBangla = "ActivityManager.MemoryInfo lowMemory = true।",
                suggestedRecovery = RecoveryAction(
                    type = "CLEAR_APP_CACHE",
                    titleBangla = "মেমোরি রিলিজ",
                    descriptionBangla = "অভ্যন্তরীণ ক্যাশ মেমোরি খালি করা হচ্ছে।",
                    isSafeAutoFix = true
                )
            )
        }

        // 5. UNKNOWN FALLBACK
        return AnalysisResult(
            rootCause = RootCauseType.UNKNOWN_CAUSE,
            explanationBangla = "নির্দিষ্ট কারণ এখনও নিশ্চিত করা যায়নি: ${error.message}",
            evidenceBangla = "ত্রুটি লগ: ${error.technicalDetails.take(200)}",
            suggestedRecovery = null
        )
    }
}
