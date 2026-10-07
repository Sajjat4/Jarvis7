package com.bongolive.ai.diagnostics.engine

import android.app.ActivityManager
import android.content.Context
import android.os.Debug
import com.bongolive.ai.diagnostics.model.DeviceMemoryStatus
import com.bongolive.ai.diagnostics.model.HealthStatus

object MemoryDiagnostics {

    fun inspect(context: Context): DeviceMemoryStatus {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()

        if (activityManager == null) {
            return DeviceMemoryStatus(
                totalRamBytes = 0L,
                availableRamBytes = 0L,
                usedRamBytes = 0L,
                appAllocatedBytes = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory(),
                isLowMemory = false,
                memoryPressurePercent = 0,
                status = HealthStatus.UNKNOWN,
                details = "ActivityManager সার্ভিস পাওয়া যায়নি।"
            )
        }

        activityManager.getMemoryInfo(memoryInfo)

        val totalRam = memoryInfo.totalMem
        val availableRam = memoryInfo.availMem
        val usedRam = totalRam - availableRam
        val pressurePercent = if (totalRam > 0) ((usedRam.toDouble() / totalRam.toDouble()) * 100).toInt() else 0

        // App-specific memory
        val runtime = Runtime.getRuntime()
        val appUsed = runtime.totalMemory() - runtime.freeMemory()

        val status = when {
            memoryInfo.lowMemory || pressurePercent >= 92 -> HealthStatus.CRITICAL
            pressurePercent >= 82 -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY
        }

        val totalMb = totalRam / (1024 * 1024)
        val availMb = availableRam / (1024 * 1024)
        val appMb = appUsed / (1024 * 1024)

        val details = "মোট RAM: ${totalMb}MB, ব্যবহৃত: ${totalMb - availMb}MB (${pressurePercent}%), খালি: ${availMb}MB। MYRA বরাদ্দ: ${appMb}MB。"

        return DeviceMemoryStatus(
            totalRamBytes = totalRam,
            availableRamBytes = availableRam,
            usedRamBytes = usedRam,
            appAllocatedBytes = appUsed,
            isLowMemory = memoryInfo.lowMemory,
            memoryPressurePercent = pressurePercent,
            status = status,
            details = details
        )
    }
}
