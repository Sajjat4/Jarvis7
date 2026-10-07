package com.bongolive.ai.diagnostics.engine

import android.content.Context
import android.os.Build
import com.bongolive.ai.data.local.dao.DiagnosticDao
import com.bongolive.ai.data.local.dao.TaskDao
import com.bongolive.ai.data.local.entity.DiagnosticRunEntity
import com.bongolive.ai.diagnostics.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

class DeviceDiagnosticsEngine(
    private val context: Context,
    private val diagnosticDao: DiagnosticDao?,
    private val taskDao: TaskDao?
) {

    /**
     * Runs full real device diagnostics sequentially with live progress updates.
     */
    fun runFullDiagnosticWithProgress(hasApiKey: Boolean): Flow<Pair<String, DeviceDiagnosticSnapshot?>> = flow {
        emit(Pair("র‍্যাম ও মেমোরি স্টেট যাচাই করা হচ্ছে...", null))
        val memory = MemoryDiagnostics.inspect(context)

        emit(Pair("সিপিইউ ও সিস্টেম লোড পরীক্ষা করা হচ্ছে...", null))
        val cpu = CpuPerformanceDiagnostics.inspect()

        emit(Pair("ব্যাটারি ও চার্জিং অবস্থা যাচাই করা হচ্ছে...", null))
        val battery = BatteryDiagnostics.inspect(context)

        emit(Pair("ডিভাইস থার্মাল ও তাপমাত্রা পর্যবেক্ষণ...", null))
        val thermal = ThermalDiagnostics.inspect(context)

        emit(Pair("স্টোরেজ ও ডিস্ক মেমোরি বিশ্লেষণ...", null))
        val storage = StorageDiagnostics.inspect()

        emit(Pair("ইন্টারনেট ও Gemini সার্ভার যোগাযোগ পরীক্ষা...", null))
        val network = NetworkDiagnostics.inspect(context)

        emit(Pair("Gemini Live WebSocket সংযোগ যাচাই...", null))
        val gemini = GeminiDiagnostics.inspect(hasApiKey)

        emit(Pair("মাইক্রোফোন ও অডিও রেকর্ডার পাইপলাইন চেক...", null))
        val audio = AudioDiagnostics.inspect(context)

        emit(Pair("Android অ্যাক্সেসিবিলিটি সার্ভিস ও নোড অ্যানালাইসিস...", null))
        val accessibility = AccessibilityDiagnostics.inspect(context)

        emit(Pair("স্ক্রিন ভিশন ও ফ্লোটিং ওভারলে সার্ভিস পরীক্ষা...", null))
        val overlay = ServiceDiagnostics.inspectOverlay(context)
        val screenCapture = ServiceDiagnostics.inspectScreenCapture()
        val services = ServiceDiagnostics.inspectForegroundServices()
        val continuity = ServiceDiagnostics.inspectContinuity(taskDao)

        emit(Pair("ত্রুটি ও রুট-কজ ডাটাবেস পর্যালোচনা করা হচ্ছে...", null))

        // Aggregate Issues & Recommendations
        val issues = mutableListOf<String>()
        val recommendations = mutableListOf<String>()

        if (accessibility.status == HealthStatus.ERROR) {
            issues.add("Accessibility Service বন্ধ আছে।")
            recommendations.add("সেটিংস থেকে 'BongoLive AI Auto-Service' চালু করুন যাতে MYRA স্ক্রিনে স্বয়ংক্রিয়ভাবে কাজ করতে পারে।")
        }
        if (audio.status == HealthStatus.ERROR) {
            issues.add("মাইক্রোফোন পারমিশন অনুমোদিত নয়।")
            recommendations.add("অ্যাপ পারমিশন সেটিংসে গিয়ে 'Microphone' চালু করুন।")
        }
        if (!gemini.hasApiKey) {
            issues.add("Gemini API Key যুক্ত করা হয়নি।")
            recommendations.add("সেটিংস মেনু থেকে আপনার Gemini API Key প্রবেশ করান।")
        } else if (gemini.status == HealthStatus.ERROR) {
            issues.add("Gemini Live সংযোগে ত্রুটি: ${gemini.lastError}")
            recommendations.add("ইন্টারনেট সংযোগ চেক করুন অথবা Gemini API Key পুনরায় যাচাই করুন।")
        }
        if (network.status == HealthStatus.ERROR) {
            issues.add("ডিভাইসে সক্রিয় ইন্টারনেট সংযোগ নেই।")
            recommendations.add("ওয়াই-ফাই বা মোবাইল ডাটা চালু করুন।")
        }
        if (storage.status == HealthStatus.CRITICAL) {
            issues.add("স্টোরেজ সংকটজনক পর্যায়ে (<10% মুক্ত)।")
            recommendations.add("অপ্রয়োজনীয় ফাইল ডিলিট করে ফোন মেমোরি খালি করুন।")
        }
        if (battery.status == HealthStatus.CRITICAL) {
            issues.add("ব্যাটারি চার্জ খুব কম (${battery.levelPercent}%)।")
            recommendations.add("চার্জার কানেক্ট করুন যাতে ব্যাকগ্রাউন্ড অটোমেশন বন্ধ না হয়।")
        }
        if (!battery.isBatteryOptimizationIgnored) {
            recommendations.add("দীর্ঘমেয়াদী ব্যাকগ্রাউন্ড কাজের জন্য Battery Optimization বন্ধ রাখা ভালো।")
        }

        val allStatuses = listOf(
            memory.status, cpu.systemLoadStatus, battery.status, thermal.status,
            storage.status, network.status, gemini.status, audio.status,
            accessibility.status, overlay.status, screenCapture.status,
            services.status, continuity.status
        )

        val overallHealth = when {
            allStatuses.any { it == HealthStatus.CRITICAL } -> HealthStatus.CRITICAL
            allStatuses.any { it == HealthStatus.ERROR } -> HealthStatus.ERROR
            allStatuses.any { it == HealthStatus.DEGRADED } -> HealthStatus.DEGRADED
            allStatuses.all { it == HealthStatus.UNKNOWN } -> HealthStatus.UNKNOWN
            else -> HealthStatus.HEALTHY
        }

        val snapshot = DeviceDiagnosticSnapshot(
            androidVersion = Build.VERSION.RELEASE ?: "Unknown",
            sdkInt = Build.VERSION.SDK_INT,
            deviceManufacturer = Build.MANUFACTURER ?: "Generic",
            deviceModel = Build.MODEL ?: "Android Device",
            memory = memory,
            cpu = cpu,
            battery = battery,
            thermal = thermal,
            storage = storage,
            network = network,
            gemini = gemini,
            audio = audio,
            accessibility = accessibility,
            overlay = overlay,
            screenCapture = screenCapture,
            services = services,
            continuity = continuity,
            overallHealth = overallHealth,
            issuesFound = issues,
            recommendationsBangla = recommendations
        )

        // Save to Room DB asynchronously
        diagnosticDao?.insertRun(
            DiagnosticRunEntity(
                overallHealth = overallHealth.name,
                ramUsedMb = memory.usedRamBytes / (1024 * 1024),
                ramTotalMb = memory.totalRamBytes / (1024 * 1024),
                storageFreePercent = storage.freePercent,
                batteryPercent = battery.levelPercent,
                isCharging = battery.isCharging,
                networkType = network.transportType,
                geminiStatus = gemini.connectionState,
                accessibilityActive = accessibility.isServiceConnected,
                overlayActive = overlay.hasOverlayPermission,
                screenCaptureActive = screenCapture.isVirtualDisplayActive,
                issuesFoundCount = issues.size,
                summaryBangla = buildSummaryBangla(snapshot)
            )
        )

        emit(Pair("ডায়াগনস্টিক সম্পূর্ণ!", snapshot))
    }.flowOn(Dispatchers.IO)

    suspend fun getQuickSnapshot(hasApiKey: Boolean): DeviceDiagnosticSnapshot = withContext(Dispatchers.IO) {
        val memory = MemoryDiagnostics.inspect(context)
        val cpu = CpuPerformanceDiagnostics.inspect()
        val battery = BatteryDiagnostics.inspect(context)
        val thermal = ThermalDiagnostics.inspect(context)
        val storage = StorageDiagnostics.inspect()
        val network = NetworkDiagnostics.inspect(context)
        val gemini = GeminiDiagnostics.inspect(hasApiKey)
        val audio = AudioDiagnostics.inspect(context)
        val accessibility = AccessibilityDiagnostics.inspect(context)
        val overlay = ServiceDiagnostics.inspectOverlay(context)
        val screenCapture = ServiceDiagnostics.inspectScreenCapture()
        val services = ServiceDiagnostics.inspectForegroundServices()
        val continuity = ServiceDiagnostics.inspectContinuity(taskDao)

        val issues = mutableListOf<String>()
        val recommendations = mutableListOf<String>()

        if (accessibility.status == HealthStatus.ERROR) {
            issues.add("Accessibility Service বন্ধ আছে।")
            recommendations.add("Settings থেকে 'BongoLive AI Auto-Service' চালু করুন।")
        }
        if (audio.status == HealthStatus.ERROR) {
            issues.add("মাইক্রোফোন পারমিশন বন্ধ।")
            recommendations.add("মাইক্রোফোন পারমিশন সক্রিয় করুন।")
        }
        if (!gemini.hasApiKey) {
            issues.add("Gemini API Key নেই।")
            recommendations.add("Settings এ API key দিন।")
        }
        if (network.status == HealthStatus.ERROR) {
            issues.add("ইন্টারনেট সংযোগ নেই।")
        }

        val allStatuses = listOf(
            memory.status, cpu.systemLoadStatus, battery.status, thermal.status,
            storage.status, network.status, gemini.status, audio.status,
            accessibility.status, overlay.status, screenCapture.status,
            services.status, continuity.status
        )

        val overallHealth = when {
            allStatuses.any { it == HealthStatus.CRITICAL } -> HealthStatus.CRITICAL
            allStatuses.any { it == HealthStatus.ERROR } -> HealthStatus.ERROR
            allStatuses.any { it == HealthStatus.DEGRADED } -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY
        }

        DeviceDiagnosticSnapshot(
            androidVersion = Build.VERSION.RELEASE ?: "Unknown",
            sdkInt = Build.VERSION.SDK_INT,
            deviceManufacturer = Build.MANUFACTURER ?: "Generic",
            deviceModel = Build.MODEL ?: "Android Device",
            memory = memory,
            cpu = cpu,
            battery = battery,
            thermal = thermal,
            storage = storage,
            network = network,
            gemini = gemini,
            audio = audio,
            accessibility = accessibility,
            overlay = overlay,
            screenCapture = screenCapture,
            services = services,
            continuity = continuity,
            overallHealth = overallHealth,
            issuesFound = issues,
            recommendationsBangla = recommendations
        )
    }

    private fun buildSummaryBangla(snapshot: DeviceDiagnosticSnapshot): String {
        return when (snapshot.overallHealth) {
            HealthStatus.HEALTHY -> "ডিভাইসের সকল সিস্টেম, মেমোরি, নেটওয়ার্ক এবং MYRA অটোমেশন সাবসিস্টেম সম্পূর্ণ সুস্থ ও কার্যকর আছে।"
            HealthStatus.DEGRADED -> "সিস্টেম সক্রিয় রয়েছে, তবে কিছু সীমাবদ্ধতা পাওয়া গেছে (${snapshot.issuesFound.joinToString(", ")}।)"
            HealthStatus.ERROR -> "গুরুত্বপূর্ণ ত্রুটি সনাক্ত হয়েছে: ${snapshot.issuesFound.joinToString(", ")}।"
            HealthStatus.CRITICAL -> "সংকটজনক অবস্থা: ব্যাটারি বা মেমোরির সীমাবদ্ধতা ব্যাকগ্রাউন্ড অটোমেশনে বিঘ্ন ঘটাতে পারে।"
            HealthStatus.UNKNOWN -> "কিছু সিস্টেম স্ট্যাটাস পরিদর্শনে Android অনুমতি সীমাবদ্ধ।"
        }
    }
}
