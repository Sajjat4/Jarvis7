package com.bongolive.ai

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.bongolive.ai.data.local.AppDatabase
import com.bongolive.ai.data.local.PreferencesDataStore

class BongoLiveApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var preferencesDataStore: PreferencesDataStore
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize Room Database
        database = AppDatabase.getDatabase(this)

        // Initialize Preferences DataStore
        preferencesDataStore = PreferencesDataStore(this)

        // Create Notification Channel for Live Voice Foreground Service
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val liveChannel = NotificationChannel(
                CHANNEL_LIVE_VOICE,
                "BongoLive Voice Assistant",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "রিয়েল-টাইম বাংলা ভয়েস অ্যাসিস্ট্যান্ট ব্যাকগ্রাউন্ড সার্ভিস"
            }

            val commChannel = NotificationChannel(
                CHANNEL_CALL_ALERTS,
                "BongoLive কল ও কমিউনিকেশন এলার্ট",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "ইনকামিং হোয়াটসঅ্যাপ, মেসেঞ্জার, টেলিগ্রাম ও সিগনাল কল সতর্কতা"
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(liveChannel)
            notificationManager?.createNotificationChannel(commChannel)
        }
    }

    companion object {
        const val CHANNEL_LIVE_VOICE = "bongolive_live_voice_channel"
        const val CHANNEL_CALL_ALERTS = "bongolive_call_alerts_channel"

        lateinit var instance: BongoLiveApp
            private set
    }
}
