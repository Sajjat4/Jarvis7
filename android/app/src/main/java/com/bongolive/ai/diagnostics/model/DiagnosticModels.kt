package com.bongolive.ai.diagnostics.model

enum class HealthStatus {
    HEALTHY,    // 🟢 Green - Everything functional
    DEGRADED,   // 🟡 Yellow - Functional with warnings or minor limitations
    ERROR,      // 🔴 Red - Critical feature failed or blocked
    CRITICAL,   // 🛑 Dark Red - Severe system state (e.g. low memory, battery dying)
    UNKNOWN     // ⚪ Gray - Android OS restricts API access, cannot verify
}

enum class ErrorCategory {
    NETWORK_ERROR,
    GEMINI_ERROR,
    AUTH_ERROR,
    TIMEOUT,
    PERMISSION_ERROR,
    ACCESSIBILITY_ERROR,
    SCREEN_CAPTURE_ERROR,
    OVERLAY_ERROR,
    AUDIO_ERROR,
    SERVICE_ERROR,
    UI_TARGET_NOT_FOUND,
    CLICK_FAILED,
    TYPE_FAILED,
    SCROLL_FAILED,
    APP_LAUNCH_FAILED,
    VERIFICATION_FAILED,
    BACKGROUND_INTERRUPTION,
    PROCESS_RECREATED,
    DATABASE_ERROR,
    UNKNOWN_ERROR
}

enum class RootCauseType {
    NETWORK_DISCONNECTED,
    NETWORK_UNVALIDATED,
    GEMINI_API_KEY_MISSING,
    GEMINI_AUTH_INVALID,
    GEMINI_WS_CLOSED,
    GEMINI_RATE_LIMITED,
    ACCESSIBILITY_SERVICE_DISABLED,
    ACCESSIBILITY_NODE_UNRESPONSIVE,
    ACCESSIBILITY_TARGET_NOT_FOUND,
    ACCESSIBILITY_CLICK_UNSUPPORTED,
    RECORD_AUDIO_PERMISSION_DENIED,
    AUDIO_RECORD_INIT_FAILED,
    AUDIO_TRACK_INIT_FAILED,
    OVERLAY_PERMISSION_DENIED,
    MEDIA_PROJECTION_CONSENT_MISSING,
    NOTIFICATION_PERMISSION_DENIED,
    BATTERY_SAVER_ACTIVE,
    BATTERY_CRITICALLY_LOW,
    BATTERY_OPTIMIZATION_THROTTLING,
    THERMAL_THROTTLING,
    STORAGE_CRITICALLY_LOW,
    RAM_CRITICALLY_LOW,
    FOREGROUND_SERVICE_NOT_RUNNING,
    BACKGROUND_USER_SWITCHED_APP,
    PROCESS_TERMINATED_BY_OS,
    UI_STATE_UNVERIFIED,
    UNKNOWN_CAUSE
}

data class DeviceMemoryStatus(
    val totalRamBytes: Long,
    val availableRamBytes: Long,
    val usedRamBytes: Long,
    val appAllocatedBytes: Long,
    val isLowMemory: Boolean,
    val memoryPressurePercent: Int,
    val status: HealthStatus,
    val details: String
)

data class CpuPerformanceStatus(
    val processThreadCount: Int,
    val availableProcessors: Int,
    val diagnosticSamplingLatencyMs: Long,
    val systemLoadStatus: HealthStatus,
    val details: String
)

data class BatteryStatus(
    val levelPercent: Int,
    val isCharging: Boolean,
    val chargingSource: String, // AC, USB, Wireless, None
    val temperatureCelsius: Float,
    val voltageMv: Int,
    val healthState: String, // Good, Overheat, Dead, OverVoltage, Unspecified
    val isPowerSaveMode: Boolean,
    val isBatteryOptimizationIgnored: Boolean,
    val status: HealthStatus,
    val details: String
)

data class ThermalStatus(
    val thermalSeverity: String, // None, Light, Moderate, Severe, Critical, Emergency, Unknown
    val headroom: Float?, // Headroom metric if API supported
    val status: HealthStatus,
    val details: String
)

data class StorageStatus(
    val totalBytes: Long,
    val availableBytes: Long,
    val usedBytes: Long,
    val freePercent: Int,
    val status: HealthStatus,
    val details: String
)

data class NetworkStatus(
    val isConnected: Boolean,
    val isValidatedInternet: Boolean,
    val transportType: String, // Wi-Fi, Cellular, Ethernet, None
    val isMetered: Boolean,
    val geminiHostReachable: Boolean,
    val latencyMs: Long,
    val status: HealthStatus,
    val details: String
)

data class GeminiConnectionStatus(
    val connectionState: String, // CONNECTED, CONNECTING, DISCONNECTED, ERROR
    val isSessionActive: Boolean,
    val hasApiKey: Boolean,
    val lastConnectedTimestamp: Long,
    val lastMessageTimestamp: Long,
    val lastAudioChunkTimestamp: Long,
    val reconnectAttempts: Int,
    val lastError: String,
    val status: HealthStatus,
    val details: String
)

data class AudioStatus(
    val hasRecordAudioPermission: Boolean,
    val isRecordingActive: Boolean,
    val isPlaybackActive: Boolean,
    val audioRecordInitialized: Boolean,
    val audioTrackInitialized: Boolean,
    val status: HealthStatus,
    val details: String
)

data class AccessibilityStatus(
    val isServiceEnabledInSettings: Boolean,
    val isServiceConnected: Boolean,
    val activePackageName: String,
    val isRootNodeAvailable: Boolean,
    val activeWindowAvailable: Boolean,
    val visibleNodesCount: Int,
    val gestureSupported: Boolean,
    val lastEventTimestamp: Long,
    val status: HealthStatus,
    val details: String
)

data class OverlayStatus(
    val hasOverlayPermission: Boolean,
    val isServiceRunning: Boolean,
    val status: HealthStatus,
    val details: String
)

data class ScreenCaptureStatus(
    val hasProjectionConsent: Boolean,
    val isServiceRunning: Boolean,
    val isVirtualDisplayActive: Boolean,
    val lastCapturedFrameTimestamp: Long,
    val status: HealthStatus,
    val details: String
)

data class ForegroundServiceStatus(
    val liveVoiceServiceRunning: Boolean,
    val geminiLiveServiceRunning: Boolean,
    val screenCaptureServiceRunning: Boolean,
    val floatingAssistantRunning: Boolean,
    val status: HealthStatus,
    val details: String
)

data class BackgroundContinuityStatus(
    val currentTaskId: String?,
    val taskState: String,
    val lastSuccessfulAction: String,
    val lastObservation: String,
    val lastActionTimestamp: Long,
    val isProcessRecreated: Boolean,
    val status: HealthStatus,
    val details: String
)

data class DeviceDiagnosticSnapshot(
    val timestamp: Long = System.currentTimeMillis(),
    val androidVersion: String,
    val sdkInt: Int,
    val deviceManufacturer: String,
    val deviceModel: String,
    val memory: DeviceMemoryStatus,
    val cpu: CpuPerformanceStatus,
    val battery: BatteryStatus,
    val thermal: ThermalStatus,
    val storage: StorageStatus,
    val network: NetworkStatus,
    val gemini: GeminiConnectionStatus,
    val audio: AudioStatus,
    val accessibility: AccessibilityStatus,
    val overlay: OverlayStatus,
    val screenCapture: ScreenCaptureStatus,
    val services: ForegroundServiceStatus,
    val continuity: BackgroundContinuityStatus,
    val overallHealth: HealthStatus,
    val issuesFound: List<String>,
    val recommendationsBangla: List<String>
)

data class ErrorRecord(
    val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val category: ErrorCategory,
    val severity: HealthStatus,
    val source: String,
    val message: String,
    val technicalDetails: String = "",
    val relatedTaskId: String? = null,
    val recoverable: Boolean = true,
    var recoveryAttempted: Boolean = false,
    var recoveryResult: String = ""
)

data class RecoveryAction(
    val type: String, // RECONNECT_GEMINI, REFRESH_ACCESSIBILITY, RECREATE_AUDIO, REFRESH_NETWORK, PROMPT_SETTINGS
    val titleBangla: String,
    val descriptionBangla: String,
    val isSafeAutoFix: Boolean, // true = can execute autonomously; false = requires user confirmation
    val intentAction: String? = null
)

data class TroubleshootingResult(
    val errorRecord: ErrorRecord,
    val detectedRootCause: RootCauseType,
    val explanationBangla: String,
    val evidenceBangla: String,
    val attemptedAction: RecoveryAction?,
    val executionSuccess: Boolean,
    val verificationPassed: Boolean,
    val requiresUserAction: Boolean,
    val userActionInstructionBangla: String? = null,
    val nextStepIntent: String? = null
)
