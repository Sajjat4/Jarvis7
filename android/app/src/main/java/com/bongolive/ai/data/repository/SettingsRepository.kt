package com.bongolive.ai.data.repository

import com.bongolive.ai.data.local.PreferencesDataStore
import com.bongolive.ai.data.local.dao.SettingsDao
import com.bongolive.ai.data.local.entity.AppSettingsEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

class SettingsRepository(
    private val preferencesDataStore: PreferencesDataStore,
    private val settingsDao: SettingsDao
) {

    val customApiKey: Flow<String> = preferencesDataStore.customApiKeyFlow
    val useCustomApiKey: Flow<Boolean> = preferencesDataStore.useCustomApiKeyFlow
    val liveModel: Flow<String> = preferencesDataStore.liveModelFlow
    val chatModel: Flow<String> = preferencesDataStore.chatModelFlow
    val voiceName: Flow<String> = preferencesDataStore.voiceNameFlow
    val systemInstruction: Flow<String> = preferencesDataStore.systemInstructionFlow
    val enableCaptions: Flow<Boolean> = preferencesDataStore.enableCaptionsFlow
    val accessibilityEnabled: Flow<Boolean> = preferencesDataStore.accessibilityEnabledFlow
    val floatingOverlayEnabled: Flow<Boolean> = preferencesDataStore.floatingOverlayEnabledFlow
    val speechRate: Flow<Float> = preferencesDataStore.speechRateFlow
    val highContrast: Flow<Boolean> = preferencesDataStore.highContrastFlow
    val fontSize: Flow<String> = preferencesDataStore.fontSizeFlow
    val bengaliDialect: Flow<String> = preferencesDataStore.bengaliDialectFlow
    val defaultGroundingMode: Flow<String> = preferencesDataStore.defaultGroundingModeFlow

    // Room database snapshot flow
    val roomSettingsFlow: Flow<AppSettingsEntity?> = settingsDao.getSettingsFlow()

    suspend fun saveApiKey(key: String, useCustom: Boolean) {
        preferencesDataStore.saveApiKey(key, useCustom)
        syncToRoom()
    }

    suspend fun saveLiveModel(model: String) {
        preferencesDataStore.saveLiveModel(model)
        syncToRoom()
    }

    suspend fun saveChatModel(model: String) {
        preferencesDataStore.saveChatModel(model)
        syncToRoom()
    }

    suspend fun saveVoiceName(voice: String) {
        preferencesDataStore.saveVoiceName(voice)
        syncToRoom()
    }

    suspend fun setAccessibilityEnabled(enabled: Boolean) {
        preferencesDataStore.setAccessibilityEnabled(enabled)
        syncToRoom()
    }

    suspend fun setFloatingOverlayEnabled(enabled: Boolean) {
        preferencesDataStore.setFloatingOverlayEnabled(enabled)
        syncToRoom()
    }

    suspend fun setSpeechRate(rate: Float) {
        preferencesDataStore.setSpeechRate(rate)
        syncToRoom()
    }

    suspend fun setCaptionsEnabled(enabled: Boolean) {
        preferencesDataStore.setCaptionsEnabled(enabled)
        syncToRoom()
    }

    suspend fun setDefaultGroundingMode(mode: String) {
        preferencesDataStore.setDefaultGroundingMode(mode)
        syncToRoom()
    }

    /**
     * Synchronizes in-memory DataStore preferences to Room database table for multi-process safety and backup.
     */
    suspend fun syncToRoom() {
        val entity = AppSettingsEntity(
            id = 1,
            customApiKey = preferencesDataStore.customApiKeyFlow.first(),
            useCustomApiKey = preferencesDataStore.useCustomApiKeyFlow.first(),
            youtubeApiKey = preferencesDataStore.youtubeApiKeyFlow.first(),
            liveModel = preferencesDataStore.liveModelFlow.first(),
            chatModel = preferencesDataStore.chatModelFlow.first(),
            voice = preferencesDataStore.voiceNameFlow.first(),
            systemInstruction = preferencesDataStore.systemInstructionFlow.first(),
            enableLiveCaptions = preferencesDataStore.enableCaptionsFlow.first(),
            accessibilityServiceEnabled = preferencesDataStore.accessibilityEnabledFlow.first(),
            floatingOverlayEnabled = preferencesDataStore.floatingOverlayEnabledFlow.first(),
            speechRate = preferencesDataStore.speechRateFlow.first(),
            highContrast = preferencesDataStore.highContrastFlow.first(),
            fontSize = preferencesDataStore.fontSizeFlow.first(),
            bengaliDialect = preferencesDataStore.bengaliDialectFlow.first(),
            defaultGroundingMode = preferencesDataStore.defaultGroundingModeFlow.first()
        )
        settingsDao.saveSettings(entity)
    }

    /**
     * Restores settings from Room snapshot into DataStore if DataStore is uninitialized.
     */
    suspend fun restoreFromRoomIfExists() {
        val saved = settingsDao.getSettings() ?: return
        preferencesDataStore.saveApiKey(saved.customApiKey, saved.useCustomApiKey)
        preferencesDataStore.saveYouTubeKey(saved.youtubeApiKey)
        preferencesDataStore.saveLiveModel(saved.liveModel)
        preferencesDataStore.saveChatModel(saved.chatModel)
        preferencesDataStore.saveVoiceName(saved.voice)
        preferencesDataStore.saveSystemInstruction(saved.systemInstruction)
        preferencesDataStore.setCaptionsEnabled(saved.enableLiveCaptions)
        preferencesDataStore.setAccessibilityEnabled(saved.accessibilityServiceEnabled)
        preferencesDataStore.setFloatingOverlayEnabled(saved.floatingOverlayEnabled)
        preferencesDataStore.setSpeechRate(saved.speechRate)
        preferencesDataStore.setHighContrast(saved.highContrast)
        preferencesDataStore.setFontSize(saved.fontSize)
        preferencesDataStore.setBengaliDialect(saved.bengaliDialect)
        preferencesDataStore.setDefaultGroundingMode(saved.defaultGroundingMode)
    }
}
