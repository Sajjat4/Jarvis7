package com.bongolive.ai.ui.screens.diagnostics

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bongolive.ai.data.local.entity.DiagnosticErrorEntity
import com.bongolive.ai.data.local.entity.RecoveryAttemptEntity
import com.bongolive.ai.diagnostics.model.DeviceDiagnosticSnapshot
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.ui.theme.*
import com.bongolive.ai.ui.viewmodel.DiagnosticsViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceDiagnosticsScreen(
    viewModel: DiagnosticsViewModel,
    hasApiKey: Boolean,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val snapshot by viewModel.snapshot.collectAsState()
    val isRunning by viewModel.isRunningDiagnostics.collectAsState()
    val progressStep by viewModel.currentProgressStep.collectAsState()
    val recentErrors by viewModel.recentErrors.collectAsState()
    val recentRecoveries by viewModel.recentRecoveries.collectAsState()
    val troubleshootingResult by viewModel.lastTroubleshootingResult.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) } // 0: Health, 1: Error History & Root Cause
    val dateFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "MYRA ডিভাইস ডায়াগনস্টিক ও সেলফ-হিলিং",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "রিয়েল ডিভাইস স্টেট, রুট-কজ ও অটো-ট্রাবলশুটিং",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark)
            )
        },
        containerColor = BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // "Check My Device" Action Header
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "সার্বক্ষণিক ডিভাইস পর্যবেক্ষণ",
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "মেমোরি, নেটওয়ার্ক, পারমিশন, অ্যাক্সেসিবিলিটি ও ভয়েস পাইপলাইন",
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }

                        Button(
                            onClick = { viewModel.runFullDiagnostics(hasApiKey) },
                            enabled = !isRunning,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Emerald500,
                                contentColor = Color.Black
                            ),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            if (isRunning) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = Color.Black
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("পরীক্ষা চলছে...", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            } else {
                                Icon(Icons.Default.HealthAndSafety, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("ফোন চেক করো", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Live sequential progress indicator
                    AnimatedVisibility(visible = isRunning && progressStep.isNotBlank()) {
                        Column(modifier = Modifier.padding(top = 12.dp)) {
                            LinearProgressIndicator(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(CircleShape),
                                color = Emerald400,
                                trackColor = SurfaceBorder
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = progressStep,
                                color = Cyan400,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // Tab Switcher
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = SurfaceDark,
                contentColor = TextPrimary,
                divider = {}
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Text(
                            text = "ডিভাইস হেলথ",
                            fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTab == 0) Emerald400 else TextTertiary
                        )
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Text(
                            text = "রুট-কজ ও ত্রুটি লগ (${recentErrors.size})",
                            fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTab == 1) Emerald400 else TextTertiary
                        )
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Tab Content
            if (selectedTab == 0) {
                HealthTabContent(
                    snapshot = snapshot,
                    onOpenAccessibility = { viewModel.openAccessibilitySettings(context) },
                    onOpenOverlay = { viewModel.openOverlaySettings(context) },
                    onOpenBattery = { viewModel.openBatteryOptimizationSettings(context) },
                    onOpenWireless = { viewModel.openWirelessSettings(context) },
                    onOpenAppPermissions = { viewModel.openAppSettings(context) }
                )
            } else {
                ErrorHistoryTabContent(
                    recentErrors = recentErrors,
                    recentRecoveries = recentRecoveries,
                    lastResult = troubleshootingResult,
                    dateFormat = dateFormat,
                    onAutoFix = { error -> viewModel.autoFixError(error, hasApiKey) },
                    onClear = { viewModel.clearErrorHistory() }
                )
            }
        }
    }
}

@Composable
fun HealthTabContent(
    snapshot: DeviceDiagnosticSnapshot?,
    onOpenAccessibility: () -> Unit,
    onOpenOverlay: () -> Unit,
    onOpenBattery: () -> Unit,
    onOpenWireless: () -> Unit,
    onOpenAppPermissions: () -> Unit
) {
    if (snapshot == null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = Emerald400)
        }
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // Overall Status Banner
        item {
            OverallHealthBanner(snapshot = snapshot)
        }

        // 1. Accessibility Service
        item {
            DiagnosticItemCard(
                title = "Android Accessibility Service",
                status = snapshot.accessibility.status,
                icon = Icons.Default.AccessibilityNew,
                valueText = if (snapshot.accessibility.isServiceConnected) "সক্রিয় ও সংযুক্ত (Active)" else "বন্ধ (Disabled)",
                details = snapshot.accessibility.details,
                actionLabel = if (!snapshot.accessibility.isServiceEnabledInSettings) "Settings এ যান" else null,
                onAction = onOpenAccessibility
            )
        }

        // 2. Gemini Live WebSocket
        item {
            DiagnosticItemCard(
                title = "Gemini Live সংযোগ",
                status = snapshot.gemini.status,
                icon = Icons.Default.GraphicEq,
                valueText = snapshot.gemini.connectionState,
                details = snapshot.gemini.details,
                actionLabel = null,
                onAction = null
            )
        }

        // 3. Microphone & Audio
        item {
            DiagnosticItemCard(
                title = "মাইক্রোফোন ও অডিও পাইপলাইন",
                status = snapshot.audio.status,
                icon = Icons.Default.Mic,
                valueText = if (snapshot.audio.hasRecordAudioPermission) "অনুমোদিত (16kHz PCM)" else "অনুমতি নেই",
                details = snapshot.audio.details,
                actionLabel = if (!snapshot.audio.hasRecordAudioPermission) "পারমিশন দিন" else null,
                onAction = onOpenAppPermissions
            )
        }

        // 4. Memory (RAM)
        item {
            DiagnosticItemCard(
                title = "র‍্যাম মেমোরি (RAM)",
                status = snapshot.memory.status,
                icon = Icons.Default.Memory,
                valueText = "${snapshot.memory.memoryPressurePercent}% ব্যবহৃত (${snapshot.memory.usedRamBytes / (1024 * 1024)}MB / ${snapshot.memory.totalRamBytes / (1024 * 1024)}MB)",
                details = snapshot.memory.details,
                actionLabel = null,
                onAction = null
            )
        }

        // 5. Storage (Disk)
        item {
            DiagnosticItemCard(
                title = "স্টোরেজ ও ডিস্ক",
                status = snapshot.storage.status,
                icon = Icons.Default.Storage,
                valueText = "${snapshot.storage.freePercent}% খালি আছে (${snapshot.storage.availableBytes / (1024 * 1024 * 1024)}GB মুক্ত)",
                details = snapshot.storage.details,
                actionLabel = null,
                onAction = null
            )
        }

        // 6. Battery & Charging
        item {
            DiagnosticItemCard(
                title = "ব্যাটারি ও চার্জিং",
                status = snapshot.battery.status,
                icon = Icons.Default.BatteryChargingFull,
                valueText = "${snapshot.battery.levelPercent}% (${snapshot.battery.chargingSource})",
                details = snapshot.battery.details,
                actionLabel = if (!snapshot.battery.isBatteryOptimizationIgnored) "অপটিমাইজেশন" else null,
                onAction = onOpenBattery
            )
        }

        // 7. Network & Internet
        item {
            DiagnosticItemCard(
                title = "ইন্টারনেট ও নেটওয়ার্ক",
                status = snapshot.network.status,
                icon = Icons.Default.Wifi,
                valueText = "${snapshot.network.transportType} (${if (snapshot.network.geminiHostReachable) "${snapshot.network.latencyMs}ms" else "বিচ্ছিন্ন"})",
                details = snapshot.network.details,
                actionLabel = if (!snapshot.network.isConnected) "নেটওয়ার্ক সেটিংস" else null,
                onAction = onOpenWireless
            )
        }

        // 8. Screen Vision (MediaProjection)
        item {
            DiagnosticItemCard(
                title = "স্ক্রিন ভিশন (MediaProjection)",
                status = snapshot.screenCapture.status,
                icon = Icons.Default.Screenshot,
                valueText = if (snapshot.screenCapture.isVirtualDisplayActive) "সক্রিয় (Active Stream)" else "নিষ্ক্রিয় (Idle)",
                details = snapshot.screenCapture.details,
                actionLabel = null,
                onAction = null
            )
        }

        // 9. Floating Assistant (Overlay)
        item {
            DiagnosticItemCard(
                title = "সিস্টেম ফ্লোটিং বাবল",
                status = snapshot.overlay.status,
                icon = Icons.Default.Layers,
                valueText = if (snapshot.overlay.isServiceRunning) "স্ক্রিনে দৃশ্যমান" else "অনুমোদিত (Idle)",
                details = snapshot.overlay.details,
                actionLabel = if (!snapshot.overlay.hasOverlayPermission) "পারমিশন দিন" else null,
                onAction = onOpenOverlay
            )
        }

        // 10. Thermal
        item {
            DiagnosticItemCard(
                title = "ডিভাইস তাপমাত্রা ও থার্মাল",
                status = snapshot.thermal.status,
                icon = Icons.Default.Thermostat,
                valueText = snapshot.thermal.thermalSeverity,
                details = snapshot.thermal.details,
                actionLabel = null,
                onAction = null
            )
        }
    }
}

@Composable
fun OverallHealthBanner(snapshot: DeviceDiagnosticSnapshot) {
    val (bgColor, borderColor, icon, title, desc) = when (snapshot.overallHealth) {
        HealthStatus.HEALTHY -> Tuple5(
            Emerald500.copy(alpha = 0.15f),
            Emerald400,
            Icons.Default.CheckCircle,
            "ডিভাইস স্বাস্থ্য সম্পূর্ণ সুস্থ 🟢",
            "সকল হার্ডওয়্যার, নেটওয়ার্ক, পারমিশন এবং অটোমেশন সার্ভিস স্বাভাবিকভাবে কাজ করছে।"
        )
        HealthStatus.DEGRADED -> Tuple5(
            Amber400.copy(alpha = 0.15f),
            Amber400,
            Icons.Default.Warning,
            "সতর্কতা: আংশিক সীমাবদ্ধতা রয়েছে 🟡",
            snapshot.issuesFound.joinToString("\n• ", prefix = "• ")
        )
        HealthStatus.ERROR -> Tuple5(
            Red400.copy(alpha = 0.15f),
            Red400,
            Icons.Default.Error,
            "গুরুত্বপূর্ণ সার্ভিস ত্রুটি সনাক্ত 🔴",
            snapshot.issuesFound.joinToString("\n• ", prefix = "• ")
        )
        HealthStatus.CRITICAL -> Tuple5(
            Red500.copy(alpha = 0.25f),
            Red500,
            Icons.Default.Dangerous,
            "সংকটজনক সিস্টেম অবস্থা 🛑",
            "ব্যাটারি বা র‍্যামের কারণে ব্যাকগ্রাউন্ড টাস্ক বন্ধ হতে পারে।"
        )
        HealthStatus.UNKNOWN -> Tuple5(
            TextTertiary.copy(alpha = 0.15f),
            TextTertiary,
            Icons.Default.Help,
            "অজ্ঞাত স্ট্যাটাস ⚪",
            "Android অনুমতি সীমাবদ্ধ।"
        )
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = bgColor,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = borderColor, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(text = title, fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = desc, color = TextSecondary, fontSize = 11.sp, lineHeight = 16.sp)
            }
        }
    }
}

@Composable
fun DiagnosticItemCard(
    title: String,
    status: HealthStatus,
    icon: ImageVector,
    valueText: String,
    details: String,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null
) {
    val (statusColor, statusBadge) = when (status) {
        HealthStatus.HEALTHY -> Pair(Emerald400, "স্বাভাবিক")
        HealthStatus.DEGRADED -> Pair(Amber400, "সতর্কতা")
        HealthStatus.ERROR -> Pair(Red400, "ত্রুটি")
        HealthStatus.CRITICAL -> Pair(Red500, "সংকটজনক")
        HealthStatus.UNKNOWN -> Pair(TextTertiary, "অজ্ঞাত")
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = SurfaceDark,
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(statusColor.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = icon, contentDescription = null, tint = statusColor, modifier = Modifier.size(18.dp))
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(text = title, fontWeight = FontWeight.SemiBold, color = TextPrimary, fontSize = 13.sp)
                        Text(text = valueText, color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    }
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = statusColor.copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, statusColor.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = statusBadge,
                        color = statusColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(text = details, color = TextSecondary, fontSize = 11.sp, lineHeight = 15.sp)

            if (actionLabel != null && onAction != null) {
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = onAction,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Amber400.copy(alpha = 0.2f),
                        contentColor = Amber400
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Icon(imageVector = Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = actionLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun ErrorHistoryTabContent(
    recentErrors: List<DiagnosticErrorEntity>,
    recentRecoveries: List<RecoveryAttemptEntity>,
    lastResult: com.bongolive.ai.diagnostics.model.TroubleshootingResult?,
    dateFormat: SimpleDateFormat,
    onAutoFix: (DiagnosticErrorEntity) -> Unit,
    onClear: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // Last Troubleshooting Result Card
        if (lastResult != null) {
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = if (lastResult.verificationPassed) Emerald500.copy(alpha = 0.15f) else Amber400.copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (lastResult.verificationPassed) Emerald400 else Amber400)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (lastResult.verificationPassed) Icons.Default.CheckCircle else Icons.Default.Build,
                                contentDescription = null,
                                tint = if (lastResult.verificationPassed) Emerald400 else Amber400,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "সর্বশেষ রুট-কজ বিশ্লেষণ ও সেলফ-হিলিং",
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                fontSize = 13.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "রুট কজ: ${lastResult.detectedRootCause.name}",
                            fontWeight = FontWeight.SemiBold,
                            color = Cyan400,
                            fontSize = 12.sp
                        )
                        Text(
                            text = lastResult.explanationBangla,
                            color = TextPrimary,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(vertical = 2.dp)
                        )
                        Text(
                            text = "প্রমাণ: ${lastResult.evidenceBangla}",
                            color = TextSecondary,
                            fontSize = 10.sp
                        )

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "ফলাফল: ${if (lastResult.verificationPassed) "সফল ও যাচাইকৃত (Verified)" else "ব্যবহারকারীর ম্যানুয়াল পদক্ষেপ প্রয়োজন"}",
                            color = if (lastResult.verificationPassed) Emerald400 else Amber400,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "সাম্প্রতিক ত্রুটি রেকর্ড (${recentErrors.size})",
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    fontSize = 13.sp
                )
                if (recentErrors.isNotEmpty()) {
                    TextButton(onClick = onClear) {
                        Text(text = "লগ পরিষ্কার করুন", color = TextTertiary, fontSize = 11.sp)
                    }
                }
            }
        }

        if (recentErrors.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "কোনো সাম্প্রতিক ত্রুটি নেই। সিস্টেম সম্পূর্ণ নির্ঝঞ্ঝাট।", color = TextSecondary, fontSize = 12.sp)
                }
            }
        } else {
            items(recentErrors, key = { it.id }) { errorItem ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = SurfaceDark,
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = errorItem.category,
                                fontWeight = FontWeight.Bold,
                                color = Red400,
                                fontSize = 12.sp
                            )
                            Text(
                                text = dateFormat.format(Date(errorItem.timestamp)),
                                color = TextTertiary,
                                fontSize = 10.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = errorItem.message, color = TextPrimary, fontSize = 11.sp)
                        Text(text = "উৎস: ${errorItem.source}", color = TextSecondary, fontSize = 10.sp)

                        if (errorItem.recoverable) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = { onAutoFix(errorItem) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Emerald500.copy(alpha = 0.2f),
                                    contentColor = Emerald400
                                ),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                modifier = Modifier.align(Alignment.End)
                            ) {
                                Icon(Icons.Default.Build, contentDescription = null, modifier = Modifier.size(12.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = "অটো-ফিক্স চেষ্টা করুন", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

private data class Tuple5<A, B, C, D, E>(val a: A, val b: B, val c: C, val d: D, val e: E)
