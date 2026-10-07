package com.bongolive.ai.diagnostics.engine

import android.content.Context
import android.provider.Settings
import com.bongolive.ai.diagnostics.model.AccessibilityStatus
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.service.accessibility.MyraAccessibilityService

object AccessibilityDiagnostics {

    fun inspect(context: Context): AccessibilityStatus {
        val serviceInstance = MyraAccessibilityService.instance
        val isServiceConnected = serviceInstance != null && serviceInstance.isServiceActive.value

        // Factual verification in Android Settings.Secure
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        val isServiceEnabledInSettings = enabledServices.contains(context.packageName)

        val activePackage = serviceInstance?.currentActivePackage?.value ?: ""
        val lastEventTime = serviceInstance?.lastUiChangeTimestamp?.value ?: 0L

        val rootNode = try {
            serviceInstance?.rootInActiveWindow
        } catch (e: Exception) {
            null
        }
        val isRootAvailable = rootNode != null
        val activeWindowAvailable = serviceInstance?.windows?.isNotEmpty() == true || isRootAvailable

        val visibleNodes = serviceInstance?.dumpVisibleNodes() ?: emptyList()
        val visibleCount = visibleNodes.size
        val gestureSupported = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N

        val status = when {
            !isServiceEnabledInSettings -> HealthStatus.ERROR
            !isServiceConnected -> HealthStatus.ERROR
            !isRootAvailable -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY
        }

        val details = buildString {
            if (!isServiceEnabledInSettings) {
                append("অ্যাক্সেসিবিলিটি সার্ভিস বন্ধ। অন্য অ্যাপ অটোমেশন করতে Android Settings থেকে চালু করতে হবে।")
            } else if (!isServiceConnected) {
                append("সার্ভিস সেটিংসে সক্রিয় থাকলেও হ্যান্ডলার এখনো কানেক্ট হয়নি।")
            } else {
                append("সার্ভিস সক্রিয় ও সংযুক্ত। সক্রিয় অ্যাপ: ${activePackage.ifBlank { "Home / System" }} | দৃশ্যমান নোড: $visibleCount টি")
            }
        }

        return AccessibilityStatus(
            isServiceEnabledInSettings = isServiceEnabledInSettings,
            isServiceConnected = isServiceConnected,
            activePackageName = activePackage,
            isRootNodeAvailable = isRootAvailable,
            activeWindowAvailable = activeWindowAvailable,
            visibleNodesCount = visibleCount,
            gestureSupported = gestureSupported,
            lastEventTimestamp = lastEventTime,
            status = status,
            details = details
        )
    }
}
