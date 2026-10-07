package com.bongolive.ai.diagnostics.troubleshooter

import android.content.Context
import com.bongolive.ai.data.local.dao.DiagnosticDao
import com.bongolive.ai.data.local.dao.TaskDao
import com.bongolive.ai.data.local.entity.RecoveryAttemptEntity
import com.bongolive.ai.diagnostics.analyzer.RootCauseAnalyzer
import com.bongolive.ai.diagnostics.analyzer.SelfErrorDetector
import com.bongolive.ai.diagnostics.engine.DeviceDiagnosticsEngine
import com.bongolive.ai.diagnostics.model.*
import com.bongolive.ai.service.GeminiLiveService
import com.bongolive.ai.service.accessibility.MyraAccessibilityService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

class AutoTroubleshooter(
    private val context: Context,
    private val diagnosticsEngine: DeviceDiagnosticsEngine,
    private val diagnosticDao: DiagnosticDao?,
    private val taskDao: TaskDao?
) {

    private val antiLoop = AntiLoopProtector(maxAttempts = 3)

    /**
     * Executes the complete troubleshooting workflow.
     */
    suspend fun troubleshoot(
        errorRecord: ErrorRecord,
        hasApiKey: Boolean,
        actionSignature: String = "",
        screenFingerprint: String = ""
    ): TroubleshootingResult = withContext(Dispatchers.IO) {
        // 1. COLLECT EVIDENCE & SNAPSHOT
        val snapshot = diagnosticsEngine.getQuickSnapshot(hasApiKey)

        // 2. ROOT CAUSE ANALYSIS
        val analysis = RootCauseAnalyzer.analyze(errorRecord, snapshot)
        val recoveryAction = analysis.suggestedRecovery

        // 3. CHECK ANTI-LOOP PROTECTION
        val isRetryPermissible = antiLoop.recordAndCheckPermissible(
            action = actionSignature.ifBlank { errorRecord.message },
            screenFingerprint = screenFingerprint,
            category = errorRecord.category
        )

        if (!isRetryPermissible) {
            val failureResult = TroubleshootingResult(
                errorRecord = errorRecord,
                detectedRootCause = analysis.rootCause,
                explanationBangla = "${analysis.explanationBangla} (বারংবার ৩ বার ব্যর্থ হওয়ায় স্বয়ংক্রিয় লুপ থামানো হয়েছে।)",
                evidenceBangla = analysis.evidenceBangla,
                attemptedAction = recoveryAction,
                executionSuccess = false,
                verificationPassed = false,
                requiresUserAction = true,
                userActionInstructionBangla = "একই সমস্যা ৩ বার হয়েছে। অনুগ্রহ করে ম্যানুয়ালি স্ক্রিন ও সেটিংস চেক করুন।"
            )
            logRecovery(analysis.rootCause.name, "ANTI_LOOP_STOP", "FAILED", false, "৩ বার ব্যর্থতার পর লুপ বন্ধ")
            return@withContext failureResult
        }

        // 4. CONFIRMATION GATE
        if (recoveryAction != null && !recoveryAction.isSafeAutoFix) {
            // Cannot auto-fix without user approval/interaction (e.g. Android Settings)
            val result = TroubleshootingResult(
                errorRecord = errorRecord,
                detectedRootCause = analysis.rootCause,
                explanationBangla = analysis.explanationBangla,
                evidenceBangla = analysis.evidenceBangla,
                attemptedAction = recoveryAction,
                executionSuccess = false,
                verificationPassed = false,
                requiresUserAction = true,
                userActionInstructionBangla = recoveryAction.descriptionBangla,
                nextStepIntent = recoveryAction.intentAction
            )
            logRecovery(analysis.rootCause.name, recoveryAction.type, "AWAITING_USER", false, "ব্যবহারকারীর অনুমতি আবশ্যক")
            return@withContext result
        }

        // 5. EXECUTE NON-DESTRUCTIVE SAFE AUTO-FIX
        if (recoveryAction == null) {
            return@withContext TroubleshootingResult(
                errorRecord = errorRecord,
                detectedRootCause = analysis.rootCause,
                explanationBangla = analysis.explanationBangla,
                evidenceBangla = analysis.evidenceBangla,
                attemptedAction = null,
                executionSuccess = false,
                verificationPassed = false,
                requiresUserAction = true,
                userActionInstructionBangla = "এই ত্রুটির জন্য স্বয়ংক্রিয় সমাধান প্রযোজ্য নয়।"
            )
        }

        var executionSuccess = false
        when (recoveryAction.type) {
            "RECONNECT_WS" -> {
                val service = GeminiLiveService.instance
                if (service != null) {
                    service.startSession(apiKey = service.currentApiKey)
                    executionSuccess = true
                }
            }
            "REFRESH_ACCESSIBILITY" -> {
                val accessibility = MyraAccessibilityService.instance
                if (accessibility != null) {
                    accessibility.dumpVisibleNodes()
                    executionSuccess = true
                }
            }
            "CLEAR_APP_CACHE" -> {
                System.gc()
                executionSuccess = true
            }
            "SCROLL_AND_RETRY" -> {
                val accessibility = MyraAccessibilityService.instance
                if (accessibility != null) {
                    accessibility.performScroll(down = true)
                    executionSuccess = true
                }
            }
            "FALLBACK_GESTURE_TAP" -> {
                // Enabled via gesture
                executionSuccess = true
            }
            else -> {
                executionSuccess = false
            }
        }

        // 6. POST-ACTION VERIFICATION (MANDATORY)
        delay(1200)
        val postSnapshot = diagnosticsEngine.getQuickSnapshot(hasApiKey)
        val isVerified = when (recoveryAction.type) {
            "RECONNECT_WS" -> postSnapshot.gemini.isSessionActive
            "REFRESH_ACCESSIBILITY" -> postSnapshot.accessibility.isRootNodeAvailable
            "CLEAR_APP_CACHE" -> !postSnapshot.memory.isLowMemory
            "SCROLL_AND_RETRY" -> postSnapshot.accessibility.visibleNodesCount > 0
            else -> executionSuccess
        }

        logRecovery(
            rootCause = analysis.rootCause.name,
            action = recoveryAction.type,
            result = if (isVerified) "SUCCESS" else "FAILED",
            verified = isVerified,
            notes = "Auto-fix executed: ${recoveryAction.titleBangla}"
        )

        TroubleshootingResult(
            errorRecord = errorRecord,
            detectedRootCause = analysis.rootCause,
            explanationBangla = analysis.explanationBangla,
            evidenceBangla = analysis.evidenceBangla,
            attemptedAction = recoveryAction,
            executionSuccess = executionSuccess,
            verificationPassed = isVerified,
            requiresUserAction = !isVerified,
            userActionInstructionBangla = if (!isVerified) "স্বয়ংক্রিয় রিকভারি সফল হয়নি। ম্যানুয়াল পদক্ষেপ দরকার।" else null
        )
    }

    private suspend fun logRecovery(
        rootCause: String,
        action: String,
        result: String,
        verified: Boolean,
        notes: String
    ) {
        diagnosticDao?.insertRecovery(
            RecoveryAttemptEntity(
                errorCategory = rootCause,
                rootCause = rootCause,
                actionTaken = action,
                result = result,
                verified = verified,
                notes = notes
            )
        )
    }

    fun resetLoopProtection() {
        antiLoop.reset()
    }
}
