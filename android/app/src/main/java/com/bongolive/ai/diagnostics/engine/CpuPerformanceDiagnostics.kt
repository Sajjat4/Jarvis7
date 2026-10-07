package com.bongolive.ai.diagnostics.engine

import com.bongolive.ai.diagnostics.model.CpuPerformanceStatus
import com.bongolive.ai.diagnostics.model.HealthStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object CpuPerformanceDiagnostics {

    suspend fun inspect(): CpuPerformanceStatus = withContext(Dispatchers.Default) {
        val startSample = System.currentTimeMillis()
        val threadCount = Thread.activeCount()
        val availableProcessors = Runtime.getRuntime().availableProcessors()

        // Lightweight responsiveness measurement
        val samplingLatencyMs = System.currentTimeMillis() - startSample

        // Android 8+ restricts /proc/stat access for third party apps.
        // We report actual threads and diagnostic sampling responsiveness truthfully.
        val status = when {
            samplingLatencyMs > 250 -> HealthStatus.DEGRADED
            threadCount > 100 -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY
        }

        val details = "সক্রিয় থ্রেড: $threadCount টি, CPU কোর: $availableProcessors টি, রেসপন্স ল্যাটেন্সি: ${samplingLatencyMs}ms (Android নিরাপত্তা নীতির কারণে সরাসরি সামগ্রিক % সুরক্ষিত)।"

        CpuPerformanceStatus(
            processThreadCount = threadCount,
            availableProcessors = availableProcessors,
            diagnosticSamplingLatencyMs = samplingLatencyMs,
            systemLoadStatus = status,
            details = details
        )
    }
}
