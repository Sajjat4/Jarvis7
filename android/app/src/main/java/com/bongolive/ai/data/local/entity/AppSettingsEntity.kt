package com.bongolive.ai.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "app_settings")
data class AppSettingsEntity(
    @PrimaryKey
    val id: Int = 1,
    val customApiKey: String = "",
    val useCustomApiKey: Boolean = false,
    val youtubeApiKey: String = "",
    val useCustomYoutubeApiKey: Boolean = false,
    val liveModel: String = "gemini-3.8-live",
    val chatModel: String = "gemini-3.5-flash",
    val voice: String = "Kore",
    val systemInstruction: String = "আপনি 'MYRA (মায়রা)' - একজন ইউনিভার্সাল অটোনোমাস এআই সহকারী।",
    val enableLiveCaptions: Boolean = true,
    val enableBackgroundMode: Boolean = true,
    val enableWakeLock: Boolean = true,
    val accessibilityServiceEnabled: Boolean = true,
    val floatingOverlayEnabled: Boolean = true,
    val speechRate: Float = 1.0f,
    val highContrast: Boolean = false,
    val fontSize: String = "normal",
    val bengaliDialect: String = "standard",
    val defaultGroundingMode: String = "auto"
)
