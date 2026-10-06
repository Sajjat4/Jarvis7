package com.bongolive.ai.data.repository

import com.bongolive.ai.data.local.dao.ChatDao
import com.bongolive.ai.data.local.entity.ChatMessageEntity
import com.bongolive.ai.data.remote.GeminiApiClient
import com.bongolive.ai.data.remote.model.ChatApiRequest
import com.bongolive.ai.data.remote.model.ChatApiResponse
import com.bongolive.ai.data.remote.model.ChatHistoryItem
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class ChatRepository(
    private val chatDao: ChatDao
) {
    private val gson = Gson()

    fun getAllMessages(): Flow<List<ChatMessageEntity>> = chatDao.getAllMessagesFlow()

    suspend fun sendMessage(
        userText: String,
        apiKey: String?,
        model: String,
        groundingMode: String = "auto"
    ): Result<ChatApiResponse> {
        val userMsgId = UUID.randomUUID().toString()
        val userEntity = ChatMessageEntity(
            id = userMsgId,
            role = "user",
            content = userText
        )
        chatDao.insertMessage(userEntity)

        return try {
            val history = chatDao.getAllMessages().map {
                ChatHistoryItem(role = it.role, content = it.content)
            }

            val request = ChatApiRequest(
                prompt = userText,
                history = history,
                model = model,
                customApiKey = apiKey,
                groundingMode = groundingMode
            )

            val response = GeminiApiClient.apiService.sendChatMessage(request)

            val assistantMsgId = UUID.randomUUID().toString()
            val assistantEntity = ChatMessageEntity(
                id = assistantMsgId,
                role = "assistant",
                content = response.text,
                actionType = response.action?.name,
                actionParam = response.action?.param,
                webSourcesJson = response.groundingMetadata?.webSources?.let { gson.toJson(it) },
                mapsPlacesJson = response.groundingMetadata?.mapsPlaces?.let { gson.toJson(it) }
            )
            chatDao.insertMessage(assistantEntity)

            Result.success(response)
        } catch (e: Exception) {
            val errorEntity = ChatMessageEntity(
                id = UUID.randomUUID().toString(),
                role = "assistant",
                content = "দুঃখিত, সংযোগে সমস্যা হয়েছে: ${e.localizedMessage ?: "অজ্ঞাত ত্রুটি"}"
            )
            chatDao.insertMessage(errorEntity)
            Result.failure(e)
        }
    }

    suspend fun clearHistory() {
        chatDao.clearChat()
    }
}
