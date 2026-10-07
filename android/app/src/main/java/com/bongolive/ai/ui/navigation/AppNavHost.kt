package com.bongolive.ai.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.bongolive.ai.data.local.dao.ExecutionLogDao
import com.bongolive.ai.service.autonomous.AutonomousTaskController
import com.bongolive.ai.ui.screens.chat.ChatScreen
import com.bongolive.ai.ui.screens.diagnostics.DeviceDiagnosticsScreen
import com.bongolive.ai.ui.screens.diagnostics.ExecutionLogScreen
import com.bongolive.ai.ui.screens.home.HomeScreen
import com.bongolive.ai.ui.screens.live.LiveVoiceOrbDialog
import com.bongolive.ai.ui.screens.news.NewsModalSheet
import com.bongolive.ai.ui.screens.settings.SettingsScreen
import com.bongolive.ai.ui.theme.*
import com.bongolive.ai.ui.viewmodel.*

@Composable
fun AppNavHost(
    homeViewModel: HomeViewModel,
    chatViewModel: ChatViewModel,
    settingsViewModel: SettingsViewModel,
    diagnosticsViewModel: DiagnosticsViewModel,
    executionLogDao: ExecutionLogDao,
    autonomousTaskController: AutonomousTaskController,
    isLiveConnected: Boolean,
    assistantCaption: String,
    userCaption: String,
    onStartLiveVoice: () -> Unit,
    onStopLiveVoice: () -> Unit,
    onInterruptLiveVoice: () -> Unit,
    onRequestMediaProjection: () -> Unit,
    onRequestOverlayPermission: () -> Unit,
    onRequestAccessibilitySettings: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    var isLiveOrbOpen by remember { mutableStateOf(false) }
    var isNewsSheetOpen by remember { mutableStateOf(false) }

    val newsList by homeViewModel.newsList.collectAsState()
    val isLoadingNews by homeViewModel.isLoadingNews.collectAsState()
    val customApiKey by settingsViewModel.customApiKey.collectAsState()

    val screens = listOf(
        Screen.Home,
        Screen.Chat,
        Screen.Diagnostics,
        Screen.Settings
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = SurfaceDark,
                contentColor = TextPrimary
            ) {
                screens.forEach { screen ->
                    val selected = currentRoute == screen.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = screen.icon,
                                contentDescription = screen.title,
                                tint = if (selected) Emerald400 else TextTertiary
                            )
                        },
                        label = {
                            Text(
                                text = screen.title,
                                color = if (selected) Emerald400 else TextTertiary
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = Emerald500.copy(alpha = 0.2f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding),
            enterTransition = { androidx.compose.animation.fadeIn(androidx.compose.animation.core.tween(200)) },
            exitTransition = { androidx.compose.animation.fadeOut(androidx.compose.animation.core.tween(200)) }
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    homeViewModel = homeViewModel,
                    onStartLiveVoice = {
                        onStartLiveVoice()
                        isLiveOrbOpen = true
                    },
                    onNavigateToChat = { navController.navigate(Screen.Chat.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                    onOpenNews = {
                        homeViewModel.fetchNews()
                        isNewsSheetOpen = true
                    },
                    onOpenYouTube = {
                        homeViewModel.searchYouTube("জনপ্রিয় বাংলা গান")
                    }
                )
            }

            composable(Screen.Chat.route) {
                ChatScreen(
                    chatViewModel = chatViewModel,
                    onStartLiveVoice = {
                        onStartLiveVoice()
                        isLiveOrbOpen = true
                    }
                )
            }

            composable(Screen.Diagnostics.route) {
                DeviceDiagnosticsScreen(
                    viewModel = diagnosticsViewModel,
                    hasApiKey = customApiKey.isNotBlank(),
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.ExecutionLogs.route) {
                ExecutionLogScreen(
                    executionLogDao = executionLogDao,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(settingsViewModel = settingsViewModel)
            }
        }

        // Live Voice Assistant Dynamic Orb Overlay
        LiveVoiceOrbDialog(
            isOpen = isLiveOrbOpen,
            isConnected = isLiveConnected,
            assistantCaption = assistantCaption,
            userCaption = userCaption,
            onInterrupt = onInterruptLiveVoice,
            onClose = {
                isLiveOrbOpen = false
                onStopLiveVoice()
            }
        )

        // News Modal Bottom Sheet
        NewsModalSheet(
            isOpen = isNewsSheetOpen,
            newsList = newsList,
            isLoading = isLoadingNews,
            onReadNews = { readText ->
                chatViewModel.sendMessage(readText)
            },
            onClose = { isNewsSheetOpen = false }
        )
    }
}
