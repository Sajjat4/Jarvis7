package com.bongolive.ai.data.local

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "bongolive_settings")

class PreferencesDataStore(private val context: Context) {

    companion object {
        val KEY_CUSTOM_API_KEY = stringPreferencesKey("custom_api_key")
        val KEY_USE_CUSTOM_API_KEY = booleanPreferencesKey("use_custom_api_key")
        val KEY_YOUTUBE_API_KEY = stringPreferencesKey("youtube_api_key")
        val KEY_LIVE_MODEL = stringPreferencesKey("live_model")
        val KEY_CHAT_MODEL = stringPreferencesKey("chat_model")
        val KEY_VOICE_NAME = stringPreferencesKey("voice_name")
        val KEY_SYSTEM_INSTRUCTION = stringPreferencesKey("system_instruction")
        val KEY_ENABLE_CAPTIONS = booleanPreferencesKey("enable_captions")
        val KEY_ACCESSIBILITY_ENABLED = booleanPreferencesKey("accessibility_enabled")
        val KEY_FLOATING_OVERLAY_ENABLED = booleanPreferencesKey("floating_overlay_enabled")
        val KEY_SPEECH_RATE = floatPreferencesKey("speech_rate")
        val KEY_HIGH_CONTRAST = booleanPreferencesKey("high_contrast")
        val KEY_FONT_SIZE = stringPreferencesKey("font_size")
        val KEY_BENGALI_DIALECT = stringPreferencesKey("bengali_dialect")
        val KEY_DEFAULT_GROUNDING_MODE = stringPreferencesKey("default_grounding_mode")
    }

    val customApiKeyFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_CUSTOM_API_KEY] ?: ""
    }

    val useCustomApiKeyFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_USE_CUSTOM_API_KEY] ?: false
    }

    val youtubeApiKeyFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_YOUTUBE_API_KEY] ?: ""
    }

    val liveModelFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_LIVE_MODEL] ?: "gemini-3.8-live"
    }

    val chatModelFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_CHAT_MODEL] ?: "gemini-3.5-flash"
    }

    val voiceNameFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_VOICE_NAME] ?: "Kore"
    }

    val systemInstructionFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_SYSTEM_INSTRUCTION] ?: "আপনি 'MYRA (মায়রা)' - একজন ইউনিভার্সাল অটোনোমাস এআই সহকারী।"
    }

    val enableCaptionsFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_ENABLE_CAPTIONS] ?: true
    }

    val accessibilityEnabledFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_ACCESSIBILITY_ENABLED] ?: true
    }

    val floatingOverlayEnabledFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_FLOATING_OVERLAY_ENABLED] ?: true
    }

    val speechRateFlow: Flow<Float> = context.dataStore.data.map { preferences ->
        preferences[KEY_SPEECH_RATE] ?: 1.0f
    }

    val highContrastFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_HIGH_CONTRAST] ?: false
    }

    val fontSizeFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_FONT_SIZE] ?: "normal"
    }

    val bengaliDialectFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_BENGALI_DIALECT] ?: "standard"
    }

    val defaultGroundingModeFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_DEFAULT_GROUNDING_MODE] ?: "auto"
    }

    suspend fun saveApiKey(key: String, useCustom: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CUSTOM_API_KEY] = key
            preferences[KEY_USE_CUSTOM_API_KEY] = useCustom
        }
    }

    suspend fun saveYouTubeKey(key: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_YOUTUBE_API_KEY] = key
        }
    }

    suspend fun saveLiveModel(model: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_LIVE_MODEL] = model
        }
    }

    suspend fun saveChatModel(model: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CHAT_MODEL] = model
        }
    }

    suspend fun saveVoiceName(voice: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_VOICE_NAME] = voice
        }
    }

    suspend fun saveSystemInstruction(instruction: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_SYSTEM_INSTRUCTION] = instruction
        }
    }

    suspend fun setCaptionsEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_ENABLE_CAPTIONS] = enabled
        }
    }

    suspend fun setAccessibilityEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_ACCESSIBILITY_ENABLED] = enabled
        }
    }

    suspend fun setFloatingOverlayEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_FLOATING_OVERLAY_ENABLED] = enabled
        }
    }

    suspend fun setSpeechRate(rate: Float) {
        context.dataStore.edit { preferences ->
            preferences[KEY_SPEECH_RATE] = rate
        }
    }

    suspend fun setHighContrast(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_HIGH_CONTRAST] = enabled
        }
    }

    suspend fun setFontSize(size: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_FONT_SIZE] = size
        }
    }

    suspend fun setBengaliDialect(dialect: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_BENGALI_DIALECT] = dialect
        }
    }

    suspend fun setDefaultGroundingMode(mode: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_DEFAULT_GROUNDING_MODE] = mode
        }
    }
}
