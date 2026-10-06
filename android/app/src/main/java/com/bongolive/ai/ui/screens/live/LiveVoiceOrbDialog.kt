package com.bongolive.ai.ui.screens.live

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.bongolive.ai.ui.theme.*

@Composable
fun LiveVoiceOrbDialog(
    isOpen: Boolean,
    isConnected: Boolean,
    assistantCaption: String,
    userCaption: String,
    onInterrupt: () -> Unit,
    onClose: () -> Unit
) {
    if (!isOpen) return

    val infiniteTransition = rememberInfiniteTransition()
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundDark.copy(alpha = 0.95f))
                .padding(24.dp)
        ) {
            // Close Button
            IconButton(
                onClick = onClose,
                modifier = Modifier.align(Alignment.TopEnd)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close",
                    tint = TextPrimary
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Top Status Header
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "বঙ্গলাইভ লাইভ অ্যাসিস্ট্যান্ট",
                        color = TextPrimary,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Surface(
                        shape = CircleShape,
                        color = if (isConnected) Emerald500.copy(alpha = 0.2f) else SurfaceElevated,
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isConnected) Emerald400 else SurfaceBorder
                        )
                    ) {
                        Text(
                            text = if (isConnected) "● লাইভ সংযোগ সচল" else "সংযোগ করা হচ্ছে...",
                            color = if (isConnected) Emerald400 else TextSecondary,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }

                // Center Pulsating Orb
                Box(
                    modifier = Modifier.size(240.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val center = Offset(size.width / 2f, size.height / 2f)
                        val radius = (size.width / 2.5f) * pulseScale

                        // Outer Glow
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    Emerald500.copy(alpha = 0.5f),
                                    Cyan400.copy(alpha = 0.3f),
                                    Color.Transparent
                                ),
                                center = center,
                                radius = radius * 1.3f
                            ),
                            radius = radius * 1.3f,
                            center = center
                        )

                        // Core Orb
                        drawCircle(
                            brush = Brush.linearGradient(
                                colors = listOf(Emerald400, Cyan400, Blue400),
                                start = Offset(0f, 0f),
                                end = Offset(size.width, size.height)
                            ),
                            radius = radius,
                            center = center
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = null,
                        tint = BackgroundDark,
                        modifier = Modifier.size(48.dp)
                    )
                }

                // Captions Display
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    if (userCaption.isNotEmpty()) {
                        Text(
                            text = "আপনি: $userCaption",
                            color = TextSecondary,
                            fontSize = 13.sp,
                            maxLines = 2
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                    }

                    if (assistantCaption.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = SurfaceDark,
                            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
                        ) {
                            Text(
                                text = assistantCaption,
                                color = TextPrimary,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(14.dp),
                                lineHeight = 20.sp
                            )
                        }
                    } else {
                        Text(
                            text = "স্বাভাবিক বাংলায় কথা বলুন, সহকারী উত্তর দেবে...",
                            color = TextTertiary,
                            fontSize = 13.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Interrupt / Stop Button
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Button(
                            onClick = onInterrupt,
                            colors = ButtonDefaults.buttonColors(containerColor = Amber400),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text(text = "কথা থামান (Interrupt)", color = BackgroundDark, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = onClose,
                            colors = ButtonDefaults.buttonColors(containerColor = Red400),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Stop, contentDescription = null, tint = TextPrimary)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "সংযোগ বিচ্ছিন্ন", color = TextPrimary)
                        }
                    }
                }
            }
        }
    }
}
