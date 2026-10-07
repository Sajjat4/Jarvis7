package com.bongolive.ai.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.bongolive.ai.data.local.dao.ChatDao
import com.bongolive.ai.data.local.dao.DiagnosticDao
import com.bongolive.ai.data.local.dao.ExecutionLogDao
import com.bongolive.ai.data.local.dao.SettingsDao
import com.bongolive.ai.data.local.dao.TaskDao
import com.bongolive.ai.data.local.entity.AppSettingsEntity
import com.bongolive.ai.data.local.entity.ChatMessageEntity
import com.bongolive.ai.data.local.entity.DiagnosticErrorEntity
import com.bongolive.ai.data.local.entity.DiagnosticRunEntity
import com.bongolive.ai.data.local.entity.ExecutionLogEntity
import com.bongolive.ai.data.local.entity.RecoveryAttemptEntity
import com.bongolive.ai.data.local.entity.TaskSnapshotEntity

@Database(
    entities = [
        ChatMessageEntity::class,
        AppSettingsEntity::class,
        TaskSnapshotEntity::class,
        ExecutionLogEntity::class,
        DiagnosticErrorEntity::class,
        DiagnosticRunEntity::class,
        RecoveryAttemptEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun chatDao(): ChatDao
    abstract fun settingsDao(): SettingsDao
    abstract fun taskDao(): TaskDao
    abstract fun executionLogDao(): ExecutionLogDao
    abstract fun diagnosticDao(): DiagnosticDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "bongolive_ai_db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
