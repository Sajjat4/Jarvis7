package com.bongolive.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bongolive.ai.data.repository.SettingsRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    init {
        viewModelScope.launch {
            settingsRepository.restoreFromRoomIfExists()
        }
    }

    val customApiKey = settingsRepository.customApiKey.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), ""
    )

    val useCustomApiKey = settingsRepository.useCustomApiKey.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), false
    )

    val liveModel = settingsRepository.liveModel.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), "gemini-3.8-live"
    )

    val chatModel = settingsRepository.chatModel.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), "gemini-3.5-flash"
    )

    val voiceName = settingsRepository.voiceName.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), "Kore"
    )

    val accessibilityEnabled = settingsRepository.accessibilityEnabled.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), true
    )

    val speechRate = settingsRepository.speechRate.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), 1.0f
    )

    val enableCaptions = settingsRepository.enableCaptions.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), true
    )

    fun saveApiKey(key: String, useCustom: Boolean) {
        viewModelScope.launch {
            settingsRepository.saveApiKey(key, useCustom)
        }
    }

    fun saveLiveModel(model: String) {
        viewModelScope.launch {
            settingsRepository.saveLiveModel(model)
        }
    }

    fun saveChatModel(model: String) {
        viewModelScope.launch {
            settingsRepository.saveChatModel(model)
        }
    }

    fun saveVoiceName(voice: String) {
        viewModelScope.launch {
            settingsRepository.saveVoiceName(voice)
        }
    }

    fun setAccessibilityEnabled(enabled: Boolean) {
        viewModelScope.launch {
            settingsRepository.setAccessibilityEnabled(enabled)
        }
    }

    fun setSpeechRate(rate: Float) {
        viewModelScope.launch {
            settingsRepository.setSpeechRate(rate)
        }
    }

    fun setCaptionsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            settingsRepository.setCaptionsEnabled(enabled)
        }
    }
}
