package com.bongolive.ai.diagnostics

import com.bongolive.ai.diagnostics.analyzer.RootCauseAnalyzer
import com.bongolive.ai.diagnostics.analyzer.SelfErrorDetector
import com.bongolive.ai.diagnostics.model.*
import com.bongolive.ai.diagnostics.troubleshooter.AntiLoopProtector
import org.junit.Assert.*
import org.junit.Test

class DiagnosticsDeterministicUnitTest {

    @Test
    fun testErrorClassification() {
        assertEquals(
            ErrorCategory.TIMEOUT,
            SelfErrorDetector.categorize("NetworkClient", "SocketTimeoutException during request")
        )
        assertEquals(
            ErrorCategory.NETWORK_ERROR,
            SelfErrorDetector.categorize("NetworkClient", "UnknownHostException: failed to connect")
        )
        assertEquals(
            ErrorCategory.AUTH_ERROR,
            SelfErrorDetector.categorize("GeminiClient", "HTTP 403: API key is invalid")
        )
        assertEquals(
            ErrorCategory.UI_TARGET_NOT_FOUND,
            SelfErrorDetector.categorize("AutonomousController", "Target not found on current screen")
        )
        assertEquals(
            ErrorCategory.CLICK_FAILED,
            SelfErrorDetector.categorize("AccessibilityService", "ACTION_CLICK returned false")
        )
        assertEquals(
            ErrorCategory.SCREEN_CAPTURE_ERROR,
            SelfErrorDetector.categorize("ScreenService", "MediaProjection session is null")
        )
    }

    @Test
    fun testRootCauseAccessibilityDisabled() {
        val dummySnapshot = createBaseSnapshot().copy(
            accessibility = AccessibilityStatus(
                isServiceEnabledInSettings = false,
                isServiceConnected = false,
                activePackageName = "",
                isRootNodeAvailable = false,
                activeWindowAvailable = false,
                visibleNodesCount = 0,
                gestureSupported = true,
                lastEventTimestamp = 0L,
                status = HealthStatus.ERROR,
                details = "Accessibility disabled"
            )
        )

        val error = ErrorRecord(
            category = ErrorCategory.CLICK_FAILED,
            severity = HealthStatus.ERROR,
            source = "AutonomousController",
            message = "Cannot click target button"
        )

        val result = RootCauseAnalyzer.analyze(error, dummySnapshot)
        assertEquals(RootCauseType.ACCESSIBILITY_SERVICE_DISABLED, result.rootCause)
        assertFalse(result.suggestedRecovery!!.isSafeAutoFix) // Requires user to open Settings
    }

    @Test
    fun testRootCauseNetworkDisconnected() {
        val dummySnapshot = createBaseSnapshot().copy(
            network = NetworkStatus(
                isConnected = false,
                isValidatedInternet = false,
                transportType = "None",
                isMetered = false,
                geminiHostReachable = false,
                latencyMs = -1L,
                status = HealthStatus.ERROR,
                details = "No internet connection"
            )
        )

        val error = ErrorRecord(
            category = ErrorCategory.GEMINI_ERROR,
            severity = HealthStatus.ERROR,
            source = "GeminiLiveWebSocketClient",
            message = "WebSocket closed unexpectedly"
        )

        val result = RootCauseAnalyzer.analyze(error, dummySnapshot)
        assertEquals(RootCauseType.NETWORK_DISCONNECTED, result.rootCause)
    }

    @Test
    fun testAntiLoopProtection() {
        val protector = AntiLoopProtector(maxAttempts = 3)
        val action = "click_text:Submit"
        val fingerprint = "screen_hash_123"
        val category = ErrorCategory.CLICK_FAILED

        // Attempt 1: Permissible
        assertTrue(protector.recordAndCheckPermissible(action, fingerprint, category))

        // Attempt 2: Permissible
        assertTrue(protector.recordAndCheckPermissible(action, fingerprint, category))

        // Attempt 3: Limit reached -> Loop detected!
        assertFalse(protector.recordAndCheckPermissible(action, fingerprint, category))

        // Different action on same screen should still be permissible
        assertTrue(protector.recordAndCheckPermissible("scroll_down", fingerprint, ErrorCategory.SCROLL_FAILED))
    }

    private fun createBaseSnapshot(): DeviceDiagnosticSnapshot {
        return DeviceDiagnosticSnapshot(
            androidVersion = "14",
            sdkInt = 34,
            deviceManufacturer = "Google",
            deviceModel = "Pixel",
            memory = DeviceMemoryStatus(8000000000L, 4000000000L, 4000000000L, 100000000L, false, 50, HealthStatus.HEALTHY, "OK"),
            cpu = CpuPerformanceStatus(20, 8, 5L, HealthStatus.HEALTHY, "OK"),
            battery = BatteryStatus(85, false, "None", 28f, 4000, "Good", false, true, HealthStatus.HEALTHY, "OK"),
            thermal = ThermalStatus("None", null, HealthStatus.HEALTHY, "OK"),
            storage = StorageStatus(128000000000L, 64000000000L, 64000000000L, 50, HealthStatus.HEALTHY, "OK"),
            network = NetworkStatus(true, true, "Wi-Fi", false, true, 45L, HealthStatus.HEALTHY, "OK"),
            gemini = GeminiConnectionStatus("CONNECTED", true, true, 1000L, 1000L, 1000L, 0, "", HealthStatus.HEALTHY, "OK"),
            audio = AudioStatus(true, false, false, true, true, HealthStatus.HEALTHY, "OK"),
            accessibility = AccessibilityStatus(true, true, "com.example.app", true, true, 15, true, 1000L, HealthStatus.HEALTHY, "OK"),
            overlay = OverlayStatus(true, false, HealthStatus.HEALTHY, "OK"),
            screenCapture = ScreenCaptureStatus(true, true, true, 1000L, HealthStatus.HEALTHY, "OK"),
            services = ForegroundServiceStatus(false, false, false, false, HealthStatus.HEALTHY, "OK"),
            continuity = BackgroundContinuityStatus(null, "IDLE", "None", "None", 0L, false, HealthStatus.HEALTHY, "OK"),
            overallHealth = HealthStatus.HEALTHY,
            issuesFound = emptyList(),
            recommendationsBangla = emptyList()
        )
    }
}
