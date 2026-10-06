package com.bongolive.ai.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bongolive.ai.ui.theme.*
import com.bongolive.ai.ui.viewmodel.HomeViewModel

data class QuickActionItem(
    val title: String,
    val desc: String,
    val icon: ImageVector,
    val iconColor: Color,
    val badge: String,
    val onClick: () -> Unit
)

@Composable
fun HomeScreen(
    homeViewModel: HomeViewModel,
    onStartLiveVoice: () -> Unit,
    onNavigateToChat: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onOpenNews: () -> Unit,
    onOpenYouTube: () -> Unit
) {
    val liveModel by homeViewModel.liveModel.collectAsState(initial = "gemini-3.8-live")
    val voiceName by homeViewModel.voiceName.collectAsState(initial = "Kore")

    val quickActions = listOf(
        QuickActionItem(
            title = "লাইভ ভয়েস কনভারসেশন",
            desc = "জিরো ল্যাটেন্সিতে বাংলায় কথা বলুন",
            icon = Icons.Default.Mic,
            iconColor = Emerald400,
            badge = "Gemini Live",
            onClick = onStartLiveVoice
        ),
        QuickActionItem(
            title = "স্ক্রিন ও ডিভাইস অ্যাসিস্ট্যান্ট",
            desc = "স্ক্রিন দেখে তাত্ক্ষণিক সাহায্য ও অটোমেশন",
            icon = Icons.Default.Screenshot,
            iconColor = Cyan400,
            badge = "অটো-ডিভাইস",
            onClick = onStartLiveVoice
        ),
        QuickActionItem(
            title = "৫টি তাজা খবর",
            desc = "টাইটেল ও সামারি সহ সহকারীর কণ্ঠে খবর শুনুন",
            icon = Icons.Default.Newspaper,
            iconColor = Amber400,
            badge = "তাজা খবর",
            onClick = onOpenNews
        ),
        QuickActionItem(
            title = "YouTube গান ও ভিডিও",
            desc = "মুখে বলা গান বা ভিডিও সরাসরি প্লে করুন",
            icon = Icons.Default.PlayCircle,
            iconColor = Red400,
            badge = "প্লেয়ার",
            onClick = onOpenYouTube
        ),
        QuickActionItem(
            title = "স্মার্ট চ্যাট মেসেঞ্জার",
            desc = "সার্চ গ্রাউন্ডিং সহ রিয়েল-টাইম প্রশ্নোত্তর",
            icon = Icons.Default.Chat,
            iconColor = Blue400,
            badge = "টেক্সট + ভয়েস",
            onClick = onNavigateToChat
        ),
        QuickActionItem(
            title = "অ্যাক্সেসিবিলিটি ও সার্ভিস",
            desc = "স্বয়ংক্রিয় স্ক্রল, টাইপ ও পারমিশন কন্ট্রোল",
            icon = Icons.Default.Security,
            iconColor = Purple400,
            badge = "Android সার্ভিস",
            onClick = onNavigateToSettings
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // Top Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Emerald500),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = null,
                                tint = BackgroundDark,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "বঙ্গলাইভ এআই",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            shape = CircleShape,
                            color = Emerald500.copy(alpha = 0.2f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Emerald500.copy(alpha = 0.5f))
                        ) {
                            Text(
                                text = "Zero Latency",
                                color = Emerald400,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = "জিরো ল্যাটেন্সি রিয়েল-টাইম বাংলা ভয়েস ও ডিভাইস সহকারী",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // Live Voice FAB Hero Card
        item {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onStartLiveVoice() },
                shape = RoundedCornerShape(20.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Emerald500.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(Emerald500.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Mic,
                                contentDescription = "Start Live Voice",
                                tint = Emerald400,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(
                                text = "লাইভ ভয়েস চালু করুন",
                                color = TextPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "মডেল: $liveModel • স্বর: $voiceName",
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Emerald400
                    )
                }
            }
        }

        // 6 Action Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                for (i in quickActions.indices step 2) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        ActionCard(action = quickActions[i], modifier = Modifier.weight(1f))
                        if (i + 1 < quickActions.size) {
                            ActionCard(action = quickActions[i + 1], modifier = Modifier.weight(1f))
                        } else {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        // Bengali Prompt Presets Header
        item {
            Text(
                text = "ভয়েস ও কমান্ড প্রম্পটসমূহ",
                style = MaterialTheme.typography.titleMedium,
                color = TextSecondary,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        // Presets List
        val presets = listOf(
            "আজকের শীর্ষ ৫টি তাজা খবর পড়ে শোনাও",
            "ইউটিউবে জনপ্রিয় রবীন্দ্রসংগীত প্লে করো",
            "স্ক্রিনের নিচে স্ক্রল করো",
            "ক্যালকুলেটর অ্যাপ ওপেন করো"
        )

        items(presets.size) { index ->
            val text = presets[index]
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToChat() },
                shape = RoundedCornerShape(14.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = text, color = TextPrimary, fontSize = 13.sp)
                    Icon(
                        imageVector = Icons.Default.ArrowForwardIos,
                        contentDescription = null,
                        tint = TextTertiary,
                        modifier = Modifier.size(12.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun ActionCard(action: QuickActionItem, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier
            .height(130.dp)
            .clickable { action.onClick() },
        shape = RoundedCornerShape(16.dp),
        color = SurfaceDark,
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Column(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(SurfaceElevated),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = action.icon,
                        contentDescription = null,
                        tint = action.iconColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = SurfaceElevated
                ) {
                    Text(
                        text = action.badge,
                        color = TextSecondary,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            Column {
                Text(
                    text = action.title,
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 12.sp,
                    maxLines = 1
                )
                Text(
                    text = action.desc,
                    color = TextSecondary,
                    fontSize = 10.sp,
                    maxLines = 1
                )
            }
        }
    }
}
