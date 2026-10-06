package com.bongolive.ai

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.bongolive.ai.data.repository.ChatRepository
import com.bongolive.ai.service.LiveVoiceForegroundService
import com.bongolive.ai.ui.navigation.AppNavHost
import com.bongolive.ai.ui.theme.BongoLiveTheme
import com.bongolive.ai.ui.viewmodel.ChatViewModel
import com.bongolive.ai.ui.viewmodel.HomeViewModel
import com.bongolive.ai.ui.viewmodel.SettingsViewModel

class MainActivity : ComponentActivity() {

    private var liveVoiceService: LiveVoiceForegroundService? = null
    private var isBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as LiveVoiceForegroundService.LocalBinder
            liveVoiceService = binder.getService()
            isBound = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            liveVoiceService = null
            isBound = false
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Permissions granted
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request runtime permissions
        checkAndRequestPermissions()

        val app = application as BongoLiveApp
        val chatRepository = ChatRepository(app.database.chatDao())
        val preferencesDataStore = app.preferencesDataStore

        val homeViewModel = HomeViewModel(preferencesDataStore)
        val chatViewModel = ChatViewModel(chatRepository, preferencesDataStore)
        val settingsViewModel = SettingsViewModel(preferencesDataStore)

        setContent {
            BongoLiveTheme {
                var isLiveConnected by remember { mutableStateOf(false) }
                var assistantCaption by remember { mutableStateOf("") }
                var userCaption by remember { mutableStateOf("") }

                // Collect service states when bound
                LaunchedEffect(isBound) {
                    val service = liveVoiceService ?: return@LaunchedEffect
                    service.isLiveConnected.collect { isLiveConnected = it }
                }

                LaunchedEffect(isBound) {
                    val service = liveVoiceService ?: return@LaunchedEffect
                    service.currentAssistantCaption.collect { assistantCaption = it }
                }

                LaunchedEffect(isBound) {
                    val service = liveVoiceService ?: return@LaunchedEffect
                    service.currentUserCaption.collect { userCaption = it }
                }

                AppNavHost(
                    homeViewModel = homeViewModel,
                    chatViewModel = chatViewModel,
                    settingsViewModel = settingsViewModel,
                    isLiveConnected = isLiveConnected,
                    assistantCaption = assistantCaption,
                    userCaption = userCaption,
                    onStartLiveVoice = {
                        startLiveVoiceService()
                    },
                    onStopLiveVoice = {
                        stopLiveVoiceService()
                    },
                    onInterruptLiveVoice = {
                        liveVoiceService?.interruptSpeech()
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

    private fun startLiveVoiceService() {
        val intent = Intent(this, LiveVoiceForegroundService::class.java).apply {
            putExtra("API_KEY", "")
        }
        ContextCompat.startForegroundService(this, intent)
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    private fun stopLiveVoiceService() {
        liveVoiceService?.stopSession()
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
