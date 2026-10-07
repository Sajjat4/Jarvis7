package com.bongolive.ai.diagnostics.analyzer

import com.bongolive.ai.data.local.dao.DiagnosticDao
import com.bongolive.ai.data.local.entity.DiagnosticErrorEntity
import com.bongolive.ai.diagnostics.model.ErrorCategory
import com.bongolive.ai.diagnostics.model.ErrorRecord
import com.bongolive.ai.diagnostics.model.HealthStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

object SelfErrorDetector {

    /**
     * Categorizes a runtime exception or message deterministically.
     */
    fun categorize(
        source: String,
        message: String,
        throwable: Throwable? = null
    ): ErrorCategory {
        val fullText = "$message ${throwable?.message.orEmpty()} ${throwable?.javaClass?.simpleName.orEmpty()}".lowercase()

        return when {
            // Network
            fullText.contains("sockettimeout") || fullText.contains("timeout") -> ErrorCategory.TIMEOUT
            fullText.contains("unknownhost") || fullText.contains("network") || fullText.contains("connectexception") || fullText.contains("failed to connect") -> ErrorCategory.NETWORK_ERROR

            // Auth
            fullText.contains("401") || fullText.contains("403") || fullText.contains("api key") || fullText.contains("unauthenticated") || fullText.contains("auth") -> ErrorCategory.AUTH_ERROR

            // Gemini WS
            fullText.contains("websocket") || fullText.contains("gemini") || fullText.contains("bidigeneratecontent") -> ErrorCategory.GEMINI_ERROR

            // Permissions
            fullText.contains("securityexception") || fullText.contains("permission") || fullText.contains("not granted") -> ErrorCategory.PERMISSION_ERROR

            // Accessibility & UI
            fullText.contains("accessibility") || fullText.contains("rootinactivewindow") -> ErrorCategory.ACCESSIBILITY_ERROR
            fullText.contains("node not found") || fullText.contains("target not found") -> ErrorCategory.UI_TARGET_NOT_FOUND
            fullText.contains("click") || fullText.contains("action_click") -> ErrorCategory.CLICK_FAILED
            fullText.contains("type") || fullText.contains("action_set_text") || fullText.contains("settext") -> ErrorCategory.TYPE_FAILED
            fullText.contains("scroll") -> ErrorCategory.SCROLL_FAILED
            fullText.contains("launch") || fullText.contains("packagemanager") || fullText.contains("activitynotfound") -> ErrorCategory.APP_LAUNCH_FAILED
            fullText.contains("verification") || fullText.contains("ui unchanged") -> ErrorCategory.VERIFICATION_FAILED

            // MediaProjection / Screen
            fullText.contains("mediaprojection") || fullText.contains("screencapture") || fullText.contains("imagereader") -> ErrorCategory.SCREEN_CAPTURE_ERROR

            // Overlay
            fullText.contains("overlay") || fullText.contains("system_alert_window") || fullText.contains("badtokenexception") -> ErrorCategory.OVERLAY_ERROR

            // Audio
            fullText.contains("audiorecord") || fullText.contains("audiotrack") || fullText.contains("record_audio") -> ErrorCategory.AUDIO_ERROR

            // Service
            fullText.contains("foreground") || fullText.contains("service") -> ErrorCategory.SERVICE_ERROR

            // Database
            fullText.contains("sqlite") || fullText.contains("room") || fullText.contains("database") -> ErrorCategory.DATABASE_ERROR

            else -> ErrorCategory.UNKNOWN_ERROR
        }
    }

    /**
     * Records a detected error in Room database for persistent diagnostic tracking.
     */
    fun recordError(
        scope: CoroutineScope,
        diagnosticDao: DiagnosticDao?,
        source: String,
        message: String,
        technicalDetails: String = "",
        throwable: Throwable? = null,
        relatedTaskId: String? = null,
        severity: HealthStatus = HealthStatus.ERROR
    ): ErrorRecord {
        val category = categorize(source, message, throwable)
        val fullTechnical = if (throwable != null) {
            "$technicalDetails\n${throwable.stackTraceToString().take(500)}"
        } else technicalDetails

        val record = ErrorRecord(
            category = category,
            severity = severity,
            source = source,
            message = message,
            technicalDetails = fullTechnical,
            relatedTaskId = relatedTaskId,
            recoverable = isCategoryRecoverable(category)
        )

        diagnosticDao?.let { dao ->
            scope.launch(Dispatchers.IO) {
                try {
                    dao.insertError(
                        DiagnosticErrorEntity(
                            category = category.name,
                            severity = severity.name,
                            source = source,
                            message = message,
                            technicalDetails = fullTechnical,
                            relatedTaskId = relatedTaskId,
                            recoverable = record.recoverable,
                            recoveryAttempted = false,
                            recoveryResult = ""
                        )
                    )
                } catch (e: Exception) {
                    // Suppress DB failure during error logging
                }
            }
        }

        return record
    }

    private fun isCategoryRecoverable(category: ErrorCategory): Boolean {
        return when (category) {
            ErrorCategory.NETWORK_ERROR,
            ErrorCategory.TIMEOUT,
            ErrorCategory.GEMINI_ERROR,
            ErrorCategory.UI_TARGET_NOT_FOUND,
            ErrorCategory.CLICK_FAILED,
            ErrorCategory.TYPE_FAILED,
            ErrorCategory.SCROLL_FAILED,
            ErrorCategory.VERIFICATION_FAILED,
            ErrorCategory.AUDIO_ERROR -> true
            else -> false
        }
    }
}
