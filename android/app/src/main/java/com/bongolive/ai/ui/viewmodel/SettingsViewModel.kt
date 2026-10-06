package com.bongolive.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bongolive.ai.data.local.PreferencesDataStore
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val preferencesDataStore: PreferencesDataStore
) : ViewModel() {

    val customApiKey = preferencesDataStore.customApiKeyFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), ""
    )

    val useCustomApiKey = preferencesDataStore.useCustomApiKeyFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), false
    )

    val liveModel = preferencesDataStore.liveModelFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), "gemini-3.8-live"
    )

    val chatModel = preferencesDataStore.chatModelFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), "gemini-3.5-flash"
    )

    val voiceName = preferencesDataStore.voiceNameFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), "Kore"
    )

    val accessibilityEnabled = preferencesDataStore.accessibilityEnabledFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), true
    )

    fun saveApiKey(key: String, useCustom: Boolean) {
        viewModelScope.launch {
            preferencesDataStore.saveApiKey(key, useCustom)
        }
    }

    fun saveLiveModel(model: String) {
        viewModelScope.launch {
            preferencesDataStore.saveLiveModel(model)
        }
    }

    fun saveChatModel(model: String) {
        viewModelScope.launch {
            preferencesDataStore.saveChatModel(model)
        }
    }

    fun saveVoiceName(voice: String) {
        viewModelScope.launch {
            preferencesDataStore.saveVoiceName(voice)
        }
    }

    fun setAccessibilityEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesDataStore.setAccessibilityEnabled(enabled)
        }
    }
}
