package com.bongolive.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bongolive.ai.data.local.PreferencesDataStore
import com.bongolive.ai.data.local.entity.ChatMessageEntity
import com.bongolive.ai.data.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class ChatViewModel(
    private val chatRepository: ChatRepository,
    private val preferencesDataStore: PreferencesDataStore
) : ViewModel() {

    val messages = chatRepository.getAllMessages().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    private val _isSending = MutableStateFlow(false)
    val isSending = _isSending.asStateFlow()

    fun sendMessage(text: String) {
        if (text.isBlank() || _isSending.value) return

        viewModelScope.launch {
            _isSending.value = true
            val useCustom = preferencesDataStore.useCustomApiKeyFlow.first()
            val apiKey = if (useCustom) preferencesDataStore.customApiKeyFlow.first() else null
            val model = preferencesDataStore.chatModelFlow.first()

            chatRepository.sendMessage(text, apiKey, model)
            _isSending.value = false
        }
    }

    fun clearChat() {
        viewModelScope.launch {
            chatRepository.clearHistory()
        }
    }
}
