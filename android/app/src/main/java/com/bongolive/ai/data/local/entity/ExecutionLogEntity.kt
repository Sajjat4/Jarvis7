package com.bongolive.ai.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "execution_logs")
data class ExecutionLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val taskId: String,
    val timestamp: Long = System.currentTimeMillis(),
    val stage: String, // GOAL, DECISION, OBSERVATION, TARGET, ACTION, RESULT, VERIFICATION
    val description: String,
    val status: String, // SUCCESS, FAILURE, RETRY, PAUSED, RESUMED, STOPPED, INFO
    val detailsJson: String? = null
)
