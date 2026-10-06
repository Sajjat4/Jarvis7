package com.bongolive.ai.data.remote

import com.bongolive.ai.data.remote.model.ChatApiRequest
import com.bongolive.ai.data.remote.model.ChatApiResponse
import com.bongolive.ai.data.remote.model.NewsApiResponse
import com.bongolive.ai.data.remote.model.YouTubeApiResponse
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface GeminiApiService {

    @POST("api/chat")
    suspend fun sendChatMessage(@Body request: ChatApiRequest): ChatApiResponse

    @GET("api/news")
    suspend fun getLatestNews(): NewsApiResponse

    @POST("api/youtube-search")
    suspend fun searchYouTube(@Body request: Map<String, String>): YouTubeApiResponse
}

object GeminiApiClient {
    // Configurable backend URL pointing to the app's server API or local host
    var baseUrl = "http://10.0.2.2:3000/" // Android emulator host alias

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    val apiService: GeminiApiService by lazy {
        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GeminiApiService::class.java)
    }
}
