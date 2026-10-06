package com.bongolive.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bongolive.ai.data.local.PreferencesDataStore
import com.bongolive.ai.data.remote.GeminiApiClient
import com.bongolive.ai.data.remote.model.NewsItem
import com.bongolive.ai.data.remote.model.YouTubeVideoItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class HomeViewModel(
    private val preferencesDataStore: PreferencesDataStore
) : ViewModel() {

    val liveModel = preferencesDataStore.liveModelFlow
    val voiceName = preferencesDataStore.voiceNameFlow
    val isCustomApiKey = preferencesDataStore.useCustomApiKeyFlow

    private val _newsList = MutableStateFlow<List<NewsItem>>(emptyList())
    val newsList = _newsList.asStateFlow()

    private val _isLoadingNews = MutableStateFlow(false)
    val isLoadingNews = _isLoadingNews.asStateFlow()

    private val _youtubeResults = MutableStateFlow<List<YouTubeVideoItem>>(emptyList())
    val youtubeResults = _youtubeResults.asStateFlow()

    fun fetchNews() {
        viewModelScope.launch {
            _isLoadingNews.value = true
            try {
                val res = GeminiApiClient.apiService.getLatestNews()
                _newsList.value = res.news
            } catch (e: Exception) {
                // Keep existing or fallback
            } finally {
                _isLoadingNews.value = false
            }
        }
    }

    fun searchYouTube(query: String) {
        viewModelScope.launch {
            try {
                val res = GeminiApiClient.apiService.searchYouTube(mapOf("query" to query))
                _youtubeResults.value = res.videos
            } catch (e: Exception) {}
        }
    }
}
