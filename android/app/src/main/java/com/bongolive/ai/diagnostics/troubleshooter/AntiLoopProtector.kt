package com.bongolive.ai.diagnostics.troubleshooter

import com.bongolive.ai.diagnostics.model.ErrorCategory

class AntiLoopProtector(private val maxAttempts: Int = 3) {

    private data class FailureSignature(
        val actionHash: String,
        val screenFingerprint: String,
        val category: ErrorCategory
    )

    private val failureCounts = mutableMapOf<FailureSignature, Int>()

    /**
     * Records a failure attempt.
     * Returns true if retry is still permissible under the limit.
     * Returns false if loop is detected (>= maxAttempts with identical signature).
     */
    fun recordAndCheckPermissible(
        action: String,
        screenFingerprint: String,
        category: ErrorCategory
    ): Boolean {
        val signature = FailureSignature(
            actionHash = action.trim().lowercase(),
            screenFingerprint = screenFingerprint.trim(),
            category = category
        )

        val currentCount = failureCounts.getOrDefault(signature, 0) + 1
        failureCounts[signature] = currentCount

        return currentCount < maxAttempts
    }

    fun getAttemptCount(
        action: String,
        screenFingerprint: String,
        category: ErrorCategory
    ): Int {
        val signature = FailureSignature(
            actionHash = action.trim().lowercase(),
            screenFingerprint = screenFingerprint.trim(),
            category = category
        )
        return failureCounts.getOrDefault(signature, 0)
    }

    fun reset() {
        failureCounts.clear()
    }
}
