package com.bongolive.ai

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.bongolive.ai.data.repository.ChatRepository
import com.bongolive.ai.data.repository.SettingsRepository
import com.bongolive.ai.service.GeminiLiveService
import com.bongolive.ai.service.autonomous.AutonomousTaskController
import com.bongolive.ai.service.floating.FloatingAssistantService
import com.bongolive.ai.service.screen.ScreenCaptureService
import com.bongolive.ai.ui.navigation.AppNavHost
import com.bongolive.ai.ui.theme.BongoLiveTheme
import com.bongolive.ai.ui.viewmodel.ChatViewModel
import com.bongolive.ai.ui.viewmodel.HomeViewModel
import com.bongolive.ai.ui.viewmodel.SettingsViewModel
import com.bongolive.ai.utils.PermissionManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var geminiLiveService: GeminiLiveService? = null
    private var isBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as GeminiLiveService.LocalBinder
            geminiLiveService = binder.getService()
            isBound = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            geminiLiveService = null
            isBound = false
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Handle runtime results
    }

    // MediaProjection Screen Capture Launcher
    private val mediaProjectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            val intent = Intent(this, ScreenCaptureService::class.java).apply {
                putExtra(ScreenCaptureService.EXTRA_RESULT_CODE, result.resultCode)
                putExtra(ScreenCaptureService.EXTRA_RESULT_DATA, result.data)
            }
            ContextCompat.startForegroundService(this, intent)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request core permissions (Audio, Notifications)
        checkAndRequestPermissions()

        val app = application as BongoLiveApp
        val chatRepository = ChatRepository(app.database.chatDao())
        val settingsRepository = SettingsRepository(
            app.preferencesDataStore,
            app.database.settingsDao()
        )
        val preferencesDataStore = app.preferencesDataStore
        val taskDao = app.database.taskDao()
        val executionLogDao = app.database.executionLogDao()
        val diagnosticDao = app.database.diagnosticDao()

        val diagnosticsEngine = com.bongolive.ai.diagnostics.engine.DeviceDiagnosticsEngine(
            applicationContext,
            diagnosticDao,
            taskDao
        )
        val autoTroubleshooter = com.bongolive.ai.diagnostics.troubleshooter.AutoTroubleshooter(
            applicationContext,
            diagnosticsEngine,
            diagnosticDao,
            taskDao
        )

        val autonomousTaskController = AutonomousTaskController(taskDao, executionLogDao, diagnosticDao)
        val homeViewModel = HomeViewModel(preferencesDataStore)
        val chatViewModel = ChatViewModel(chatRepository, preferencesDataStore, diagnosticsEngine, autoTroubleshooter)
        val settingsViewModel = SettingsViewModel(settingsRepository)
        val diagnosticsViewModel = com.bongolive.ai.ui.viewmodel.DiagnosticsViewModel(
            applicationContext,
            diagnosticDao,
            taskDao
        )

        setContent {
            BongoLiveTheme {
                var isLiveConnected by remember { mutableStateOf(false) }
                var assistantCaption by remember { mutableStateOf("") }
                var userCaption by remember { mutableStateOf("") }
                val scope = rememberCoroutineScope()

                // Collect service states when bound
                LaunchedEffect(isBound) {
                    val service = geminiLiveService ?: return@LaunchedEffect
                    service.isLiveConnected.collect { isLiveConnected = it }
                }

                LaunchedEffect(isBound) {
                    val service = geminiLiveService ?: return@LaunchedEffect
                    service.currentAssistantCaption.collect { assistantCaption = it }
                }

                LaunchedEffect(isBound) {
                    val service = geminiLiveService ?: return@LaunchedEffect
                    service.currentUserCaption.collect { userCaption = it }
                }

                AppNavHost(
                    homeViewModel = homeViewModel,
                    chatViewModel = chatViewModel,
                    settingsViewModel = settingsViewModel,
                    diagnosticsViewModel = diagnosticsViewModel,
                    executionLogDao = executionLogDao,
                    autonomousTaskController = autonomousTaskController,
                    isLiveConnected = isLiveConnected,
                    assistantCaption = assistantCaption,
                    userCaption = userCaption,
                    onStartLiveVoice = {
                        scope.launch {
                            val key = settingsRepository.customApiKey.first()
                            val voice = settingsRepository.voiceName.first()
                            val model = settingsRepository.liveModel.first()
                            startLiveVoiceService(key, voice, model)
                        }
                    },
                    onStopLiveVoice = {
                        stopLiveVoiceService()
                    },
                    onInterruptLiveVoice = {
                        geminiLiveService?.interrupt()
                    },
                    onRequestMediaProjection = {
                        requestMediaProjection()
                    },
                    onRequestOverlayPermission = {
                        if (!PermissionManager.isOverlayPermissionGranted(this)) {
                            PermissionManager.openOverlaySettings(this)
                        } else {
                            startFloatingService()
                        }
                    },
                    onRequestAccessibilitySettings = {
                        PermissionManager.openAccessibilitySettings(this)
                    }
                )
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            requestPermissionLauncher.launch(needed.toTypedArray())
        }
    }

    fun requestMediaProjection() {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjectionLauncher.launch(projectionManager.createScreenCaptureIntent())
    }

    fun startFloatingService() {
        if (PermissionManager.isOverlayPermissionGranted(this)) {
            val intent = Intent(this, FloatingAssistantService::class.java)
            startService(intent)
        } else {
            PermissionManager.openOverlaySettings(this)
        }
    }

    fun stopFloatingService() {
        val intent = Intent(this, FloatingAssistantService::class.java)
        stopService(intent)
    }

    private fun startLiveVoiceService(apiKey: String, voice: String, model: String) {
        val intent = Intent(this, GeminiLiveService::class.java).apply {
            putExtra(GeminiLiveService.EXTRA_API_KEY, apiKey)
            putExtra(GeminiLiveService.EXTRA_VOICE, voice)
            putExtra(GeminiLiveService.EXTRA_MODEL, model)
        }
        ContextCompat.startForegroundService(this, intent)
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    private fun stopLiveVoiceService() {
        geminiLiveService?.stopSession()
        if (isBound) {
            unbindService(serviceConnection)
            isBound = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isBound) {
            unbindService(serviceConnection)
            isBound = false
        }
    }
}
