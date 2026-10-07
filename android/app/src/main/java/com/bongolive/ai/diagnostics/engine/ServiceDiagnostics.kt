package com.bongolive.ai.diagnostics.engine

import android.content.Context
import com.bongolive.ai.data.local.dao.TaskDao
import com.bongolive.ai.diagnostics.model.*
import com.bongolive.ai.service.GeminiLiveService
import com.bongolive.ai.service.LiveVoiceForegroundService
import com.bongolive.ai.service.floating.FloatingAssistantService
import com.bongolive.ai.service.screen.ScreenCaptureService
import com.bongolive.ai.utils.PermissionManager

object ServiceDiagnostics {

    fun inspectOverlay(context: Context): OverlayStatus {
        val hasOverlay = PermissionManager.isOverlayPermissionGranted(context)
        val isRunning = FloatingAssistantService.isRunning()

        val status = when {
            !hasOverlay -> HealthStatus.DEGRADED
            isRunning -> HealthStatus.HEALTHY
            else -> HealthStatus.HEALTHY // Idle
        }

        val details = buildString {
            if (!hasOverlay) {
                append("ডিসপ্লে ওভারলে পারমিশন (SYSTEM_ALERT_WINDOW) দেওয়া নেই। ফ্লোটিং বাবল প্রদর্শিত হবে না।")
            } else if (isRunning) {
                append("ফ্লোটিং সহকারী বাবল স্ক্রিনে প্রদর্শিত ও সক্রিয়।")
            } else {
                append("ওভারলে পারমিশন অনুমোদিত (প্রয়োজনে চালুর জন্য প্রস্তুত)।")
            }
        }

        return OverlayStatus(
            hasOverlayPermission = hasOverlay,
            isServiceRunning = isRunning,
            status = status,
            details = details
        )
    }

    fun inspectScreenCapture(): ScreenCaptureStatus {
        val serviceInstance = ScreenCaptureService.instance
        val isRunning = serviceInstance != null
        val isCapturing = serviceInstance?.isCapturing?.value == true

        val status = when {
            isCapturing -> HealthStatus.HEALTHY
            isRunning -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY // Idle when not requested
        }

        val details = buildString {
            if (isCapturing) {
                append("MediaProjection স্ক্রিন ক্যাপচার সার্ভিস সক্রিয় এবং রিয়েল-টাইম ফ্রেম সরবরাহ করছে।")
            } else if (isRunning) {
                append("স্ক্রিন ক্যাপচার সার্ভিস শুরু হয়েছে কিন্তু ব্যবহারকারীর সম্মতি বা টোকেন অপেক্ষমাণ।")
            } else {
                append("স্ক্রিন শেয়ারিং বর্তমানে নিষ্ক্রিয় (ইউজার শুরু করলে অনুমতি চাওয়া হবে)।")
            }
        }

        return ScreenCaptureStatus(
            hasProjectionConsent = isCapturing,
            isServiceRunning = isRunning,
            isVirtualDisplayActive = isCapturing,
            lastCapturedFrameTimestamp = if (isCapturing) System.currentTimeMillis() else 0L,
            status = status,
            details = details
        )
    }

    fun inspectForegroundServices(): ForegroundServiceStatus {
        val liveVoiceRunning = LiveVoiceForegroundService.instance != null
        val geminiLiveRunning = GeminiLiveService.instance != null
        val screenRunning = ScreenCaptureService.instance != null
        val floatingRunning = FloatingAssistantService.isRunning()

        val anyCoreServiceRunning = liveVoiceRunning || geminiLiveRunning || screenRunning || floatingRunning

        val details = buildString {
            append("সার্ভিস স্ট্যাটাস: ")
            if (geminiLiveRunning) append("[Gemini Live: সক্রিয়] ")
            if (liveVoiceRunning) append("[Live Voice: সক্রিয়] ")
            if (screenRunning) append("[Screen Vision: সক্রিয়] ")
            if (floatingRunning) append("[Floating Orb: সক্রিয়] ")
            if (!anyCoreServiceRunning) append("সকল ফোরগ্রাউন্ড সার্ভিস বর্তমানে শান্ত (Idle)।")
        }

        return ForegroundServiceStatus(
            liveVoiceServiceRunning = liveVoiceRunning,
            geminiLiveServiceRunning = geminiLiveRunning,
            screenCaptureServiceRunning = screenRunning,
            floatingAssistantRunning = floatingRunning,
            status = HealthStatus.HEALTHY,
            details = details
        )
    }

    suspend fun inspectContinuity(taskDao: TaskDao?): BackgroundContinuityStatus {
        val lastTask = taskDao?.getLatestTask()

        if (lastTask == null) {
            return BackgroundContinuityStatus(
                currentTaskId = null,
                taskState = "IDLE",
                lastSuccessfulAction = "None",
                lastObservation = "None",
                lastActionTimestamp = 0L,
                isProcessRecreated = false,
                status = HealthStatus.HEALTHY,
                details = "কোনো চলমান বা পেন্ডিং অটোমেশন টাস্ক নেই।"
            )
        }

        val isInterrupted = lastTask.currentState == "RUNNING" && (System.currentTimeMillis() - lastTask.updatedAt > 60_000)
        val status = if (isInterrupted) HealthStatus.DEGRADED else HealthStatus.HEALTHY

        val details = buildString {
            append("সর্বশেষ টাস্ক: \"${lastTask.originalGoal}\" [${lastTask.currentState}]")
            if (isInterrupted) {
                append(" (টাস্কটি ব্যাকগ্রাউন্ডে বাধাগ্রস্ত হয়েছে, রিকভারি সম্ভব)")
            }
        }

        return BackgroundContinuityStatus(
            currentTaskId = lastTask.taskId,
            taskState = lastTask.currentState,
            lastSuccessfulAction = lastTask.lastSuccessfulAction,
            lastObservation = lastTask.lastObservation,
            lastActionTimestamp = lastTask.updatedAt,
            isProcessRecreated = isInterrupted,
            status = status,
            details = details
        )
    }
}
