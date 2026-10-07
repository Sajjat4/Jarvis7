package com.bongolive.ai.diagnostics.engine

import android.content.Context
import android.os.Build
import android.os.PowerManager
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.diagnostics.model.ThermalStatus

object ThermalDiagnostics {

    fun inspect(context: Context): ThermalStatus {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        if (powerManager == null) {
            return ThermalStatus(
                thermalSeverity = "অজ্ঞাত",
                headroom = null,
                status = HealthStatus.UNKNOWN,
                details = "PowerManager পাওয়া যায়নি।"
            )
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val thermalStatus = powerManager.currentThermalStatus
            val (severityText, healthStatus) = when (thermalStatus) {
                PowerManager.THERMAL_STATUS_NONE -> Pair("স্বাভাবিক (None)", HealthStatus.HEALTHY)
                PowerManager.THERMAL_STATUS_LIGHT -> Pair("হালকা থ্রটলিং (Light)", HealthStatus.HEALTHY)
                PowerManager.THERMAL_STATUS_MODERATE -> Pair("মাঝারি থ্রটলিং (Moderate)", HealthStatus.DEGRADED)
                PowerManager.THERMAL_STATUS_SEVERE -> Pair("তীব্র থ্রটলিং (Severe)", HealthStatus.DEGRADED)
                PowerManager.THERMAL_STATUS_CRITICAL -> Pair("সংকটজনক (Critical)", HealthStatus.CRITICAL)
                PowerManager.THERMAL_STATUS_EMERGENCY -> Pair("জরুরী অবস্থা (Emergency)", HealthStatus.CRITICAL)
                PowerManager.THERMAL_STATUS_SHUTDOWN -> Pair("শাটডাউন লেভেল", HealthStatus.CRITICAL)
                else -> Pair("অজ্ঞাত", HealthStatus.UNKNOWN)
            }

            val headroom = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                try {
                    powerManager.getThermalHeadroom(30)
                } catch (e: Exception) {
                    null
                }
            } else null

            val details = buildString {
                append("ডিভাইস থার্মাল স্টেট: $severityText")
                if (healthStatus == HealthStatus.DEGRADED || healthStatus == HealthStatus.CRITICAL) {
                    append("। তাপমাত্রা বেশি হওয়ায় প্রসেসিং বা ভয়েস ল্যাটেন্সি বাড়তে পারে।")
                }
            }

            return ThermalStatus(
                thermalSeverity = severityText,
                headroom = headroom,
                status = healthStatus,
                details = details
            )
        } else {
            return ThermalStatus(
                thermalSeverity = "Android 10 এর নিচে অপ্রাপ্য",
                headroom = null,
                status = HealthStatus.UNKNOWN,
                details = "এই Android সংস্করণে সিস্টেম থার্মাল API সমর্থিত নয়।"
            )
        }
    }
}
