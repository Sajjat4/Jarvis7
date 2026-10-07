package com.bongolive.ai.ui.viewmodel

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bongolive.ai.data.local.dao.DiagnosticDao
import com.bongolive.ai.data.local.dao.TaskDao
import com.bongolive.ai.data.local.entity.DiagnosticErrorEntity
import com.bongolive.ai.data.local.entity.DiagnosticRunEntity
import com.bongolive.ai.data.local.entity.RecoveryAttemptEntity
import com.bongolive.ai.diagnostics.engine.DeviceDiagnosticsEngine
import com.bongolive.ai.diagnostics.model.DeviceDiagnosticSnapshot
import com.bongolive.ai.diagnostics.model.ErrorRecord
import com.bongolive.ai.diagnostics.model.TroubleshootingResult
import com.bongolive.ai.diagnostics.troubleshooter.AutoTroubleshooter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DiagnosticsViewModel(
    private val context: Context,
    private val diagnosticDao: DiagnosticDao,
    private val taskDao: TaskDao
) : ViewModel() {

    private val engine = DeviceDiagnosticsEngine(context, diagnosticDao, taskDao)
    private val autoTroubleshooter = AutoTroubleshooter(context, engine, diagnosticDao, taskDao)

    private val _snapshot = MutableStateFlow<DeviceDiagnosticSnapshot?>(null)
    val snapshot = _snapshot.asStateFlow()

    private val _isRunningDiagnostics = MutableStateFlow(false)
    val isRunningDiagnostics = _isRunningDiagnostics.asStateFlow()

    private val _currentProgressStep = MutableStateFlow("")
    val currentProgressStep = _currentProgressStep.asStateFlow()

    private val _recentErrors = MutableStateFlow<List<DiagnosticErrorEntity>>(emptyList())
    val recentErrors = _recentErrors.asStateFlow()

    private val _recentRecoveries = MutableStateFlow<List<RecoveryAttemptEntity>>(emptyList())
    val recentRecoveries = _recentRecoveries.asStateFlow()

    private val _lastTroubleshootingResult = MutableStateFlow<TroubleshootingResult?>(null)
    val lastTroubleshootingResult = _lastTroubleshootingResult.asStateFlow()

    init {
        loadHistory()
        // Run initial light snapshot
        viewModelScope.launch {
            _snapshot.value = engine.getQuickSnapshot(hasApiKey = true)
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            diagnosticDao.getRecentErrors(30).collect {
                _recentErrors.value = it
            }
        }
        viewModelScope.launch {
            diagnosticDao.getRecentRecoveries(20).collect {
                _recentRecoveries.value = it
            }
        }
    }

    /**
     * Executes real step-by-step device diagnostics.
     */
    fun runFullDiagnostics(hasApiKey: Boolean) {
        if (_isRunningDiagnostics.value) return
        _isRunningDiagnostics.value = true

        viewModelScope.launch {
            engine.runFullDiagnosticWithProgress(hasApiKey).collect { (step, resultSnapshot) ->
                _currentProgressStep.value = step
                if (resultSnapshot != null) {
                    _snapshot.value = resultSnapshot
                }
            }
            _isRunningDiagnostics.value = false
            _currentProgressStep.value = ""
            loadHistory()
        }
    }

    /**
     * Attempts automatic troubleshooting for an error.
     */
    fun autoFixError(errorEntity: DiagnosticErrorEntity, hasApiKey: Boolean) {
        viewModelScope.launch {
            val record = ErrorRecord(
                id = errorEntity.id,
                timestamp = errorEntity.timestamp,
                category = com.bongolive.ai.diagnostics.model.ErrorCategory.valueOf(errorEntity.category),
                severity = com.bongolive.ai.diagnostics.model.HealthStatus.valueOf(errorEntity.severity),
                source = errorEntity.source,
                message = errorEntity.message,
                technicalDetails = errorEntity.technicalDetails,
                relatedTaskId = errorEntity.relatedTaskId,
                recoverable = errorEntity.recoverable
            )

            val result = autoTroubleshooter.troubleshoot(record, hasApiKey)
            _lastTroubleshootingResult.value = result

            // Refresh snapshot after fix
            _snapshot.value = engine.getQuickSnapshot(hasApiKey)
            loadHistory()
        }
    }

    fun openAccessibilitySettings(context: Context) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openOverlaySettings(context: Context) {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${context.packageName}")
        ).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openAppSettings(context: Context) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", context.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openBatteryOptimizationSettings(context: Context) {
        val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openWirelessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_WIRELESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun clearErrorHistory() {
        viewModelScope.launch {
            diagnosticDao.clearErrors()
            diagnosticDao.clearRecoveries()
            _recentErrors.value = emptyList()
            _recentRecoveries.value = emptyList()
        }
    }
}
