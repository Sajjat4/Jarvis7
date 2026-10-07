package com.bongolive.ai.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "diagnostic_errors")
data class DiagnosticErrorEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val category: String, // e.g. NETWORK_ERROR, ACCESSIBILITY_ERROR
    val severity: String, // INFO, WARNING, ERROR, CRITICAL
    val source: String,   // Subsystem e.g. "GeminiLiveWebSocketClient", "AutonomousTaskController"
    val message: String,
    val technicalDetails: String = "",
    val relatedTaskId: String? = null,
    val recoverable: Boolean = true,
    val recoveryAttempted: Boolean = false,
    val recoveryResult: String = "" // "SUCCESS", "FAILED", "SKIPPED", "CONFIRMATION_REQUIRED"
)

@Entity(tableName = "diagnostic_runs")
data class DiagnosticRunEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val overallHealth: String, // HEALTHY, DEGRADED, ERROR, CRITICAL, UNKNOWN
    val ramUsedMb: Long,
    val ramTotalMb: Long,
    val storageFreePercent: Int,
    val batteryPercent: Int,
    val isCharging: Boolean,
    val networkType: String,
    val geminiStatus: String,
    val accessibilityActive: Boolean,
    val overlayActive: Boolean,
    val screenCaptureActive: Boolean,
    val issuesFoundCount: Int,
    val summaryBangla: String
)

@Entity(tableName = "recovery_attempts")
data class RecoveryAttemptEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val errorCategory: String,
    val rootCause: String,
    val actionTaken: String,
    val result: String, // SUCCESS, FAILED, ESCALATED
    val verified: Boolean,
    val attemptCount: Int = 1,
    val notes: String = ""
)
