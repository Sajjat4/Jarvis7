package com.bongolive.ai.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bongolive.ai.ui.theme.*
import com.bongolive.ai.ui.viewmodel.SettingsViewModel
import com.bongolive.ai.utils.PermissionManager

@Composable
fun SettingsScreen(
    settingsViewModel: SettingsViewModel
) {
    val context = LocalContext.current
    val customKey by settingsViewModel.customApiKey.collectAsState()
    val useCustomKey by settingsViewModel.useCustomApiKey.collectAsState()
    val liveModel by settingsViewModel.liveModel.collectAsState()
    val chatModel by settingsViewModel.chatModel.collectAsState()
    val voiceName by settingsViewModel.voiceName.collectAsState()
    val accessibilityEnabled by settingsViewModel.accessibilityEnabled.collectAsState()

    var keyInput by remember(customKey) { mutableStateOf(customKey) }
    var isKeySaved by remember { mutableStateOf(false) }

    val voices = listOf(
        Pair("Kore", "কোরে (Kore) - শান্ত, স্পষ্ট ও প্রাঞ্জল কথন"),
        Pair("Zephyr", "জেফির (Zephyr) - বন্ধুভাবাপন্ন ও প্রাণবন্ত"),
        Pair("Puck", "পাক (Puck) - চটপটে, উদ্যমী ও বুদ্ধিদীপ্ত"),
        Pair("Fenrir", "ফেনরির (Fenrir) - গম্ভীর ও ধীরস্থির স্বর"),
        Pair("Charon", "কারন (Charon) - ভারী, কর্তৃত্বপূর্ণ ও প্রজ্ঞাবান")
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // Title
        item {
            Column {
                Text(
                    text = "সেটিংস ও কনফিগারেশন",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Gemini Live এপিআই, ভয়েস ও অ্যান্ড্রয়েড পারমিশন",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // Gemini API Key Section
        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Key,
                            contentDescription = null,
                            tint = Amber400,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Gemini API Key",
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { settingsViewModel.saveApiKey(keyInput, false) }
                    ) {
                        RadioButton(
                            selected = !useCustomKey,
                            onClick = { settingsViewModel.saveApiKey(keyInput, false) },
                            colors = RadioButtonDefaults.colors(selectedColor = Emerald400)
                        )
                        Text(
                            text = "সিস্টেম ডিফল্ট এপিআই ব্যবহার করুন",
                            color = TextPrimary,
                            fontSize = 13.sp
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { settingsViewModel.saveApiKey(keyInput, true) }
                    ) {
                        RadioButton(
                            selected = useCustomKey,
                            onClick = { settingsViewModel.saveApiKey(keyInput, true) },
                            colors = RadioButtonDefaults.colors(selectedColor = Emerald400)
                        )
                        Text(
                            text = "ব্যক্তিগত কাস্টম API Key ব্যবহার করুন",
                            color = TextPrimary,
                            fontSize = 13.sp
                        )
                    }

                    if (useCustomKey) {
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = keyInput,
                            onValueChange = { keyInput = it },
                            placeholder = { Text(text = "AIzaSy...", color = TextTertiary) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald400,
                                unfocusedBorderColor = SurfaceBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                settingsViewModel.saveApiKey(keyInput.trim(), true)
                                isKeySaved = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(text = if (isKeySaved) "সংরক্ষণ সম্পন্ন ✓" else "সংরক্ষণ করুন")
                        }
                    }
                }
            }
        }

        // Voice Picker Section
        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.RecordVoiceOver,
                            contentDescription = null,
                            tint = Cyan400,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Gemini Live ভয়েস চরিত্র",
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    voices.forEach { (name, label) ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { settingsViewModel.saveVoiceName(name) }
                                .padding(vertical = 4.dp)
                        ) {
                            RadioButton(
                                selected = voiceName == name,
                                onClick = { settingsViewModel.saveVoiceName(name) },
                                colors = RadioButtonDefaults.colors(selectedColor = Cyan400)
                            )
                            Text(
                                text = label,
                                color = if (voiceName == name) TextPrimary else TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }

        // Android System Permissions & Settings Section
        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = SurfaceDark,
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Android সিস্টেম পারমিশন ও সেটিংস",
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    // 1. Accessibility Service settings redirect
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { PermissionManager.openAccessibilitySettings(context) }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "অ্যাক্সেসিবিলিটি সার্ভিস সেটিংস", color = TextPrimary, fontSize = 13.sp)
                            Text(text = "Android সেটিংসে গিয়ে MYRA অটোমেশন চালু করুন", color = TextSecondary, fontSize = 11.sp)
                        }
                        Icon(imageVector = Icons.Default.OpenInNew, contentDescription = null, tint = Emerald400, modifier = Modifier.size(18.dp))
                    }

                    Divider(color = SurfaceBorder, thickness = 0.5.dp)

                    // 2. Display Over Other Apps (Floating overlay)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { PermissionManager.openOverlaySettings(context) }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "অন্যান্য অ্যাপের উপরে প্রদর্শন (ফ্লোটিং সহকারী)", color = TextPrimary, fontSize = 13.sp)
                            Text(text = "যেকোনো অ্যাপ ব্যবহারকালে ফ্লোটিং অ্যাসিস্ট্যান্ট আইকন প্রদর্শন", color = TextSecondary, fontSize = 11.sp)
                        }
                        Icon(imageVector = Icons.Default.OpenInNew, contentDescription = null, tint = Cyan400, modifier = Modifier.size(18.dp))
                    }

                    Divider(color = SurfaceBorder, thickness = 0.5.dp)

                    // 3. Application Details Settings
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { PermissionManager.openAppSettings(context) }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "অ্যাপের সার্বিক পারমিশন ও স্টোরেজ", color = TextPrimary, fontSize = 13.sp)
                            Text(text = "মাইক্রোফোন, নোটিফিকেশন ও ব্যাটারি অপ্টিমাইজেশন", color = TextSecondary, fontSize = 11.sp)
                        }
                        Icon(imageVector = Icons.Default.OpenInNew, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}
