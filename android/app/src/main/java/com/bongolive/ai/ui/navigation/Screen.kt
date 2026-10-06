package com.bongolive.ai.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Home : Screen("home", "হোম", Icons.Default.Home)
    object Chat : Screen("chat", "চ্যাট", Icons.Default.Chat)
    object Settings : Screen("settings", "সেটিংস", Icons.Default.Settings)
}
