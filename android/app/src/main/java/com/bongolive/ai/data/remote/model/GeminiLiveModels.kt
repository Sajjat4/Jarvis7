package com.bongolive.ai.data.remote.model

import com.google.gson.annotations.SerializedName

// Chat HTTP API Request / Response models
data class ChatApiRequest(
    val prompt: String,
    val history: List<ChatHistoryItem> = emptyList(),
    val model: String = "gemini-3.5-flash",
    val customApiKey: String? = null,
    val imageBase64: String? = null,
    val groundingMode: String = "auto"
)

data class ChatHistoryItem(
    val role: String,
    val content: String
)

data class ChatApiResponse(
    val text: String,
    val action: ActionPayload? = null,
    val groundingMetadata: GroundingMetadataPayload? = null
)

data class ActionPayload(
    val name: String,
    val param: String? = null
)

data class GroundingMetadataPayload(
    val mode: String,
    val webSources: List<WebSourceItem>? = null,
    val mapsPlaces: List<MapsPlaceItem>? = null
)

data class WebSourceItem(
    val title: String,
    val uri: String
)

data class MapsPlaceItem(
    val title: String,
    val uri: String,
    val address: String? = null
)

// News items
data class NewsItem(
    val id: Int,
    val category: String,
    val title: String,
    val summary: String,
    val timeAgo: String,
    val readText: String
)

data class NewsApiResponse(
    val news: List<NewsItem>
)

// YouTube item
data class YouTubeVideoItem(
    val id: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val description: String
)

data class YouTubeApiResponse(
    val videos: List<YouTubeVideoItem>
)
