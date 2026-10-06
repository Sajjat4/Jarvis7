package com.bongolive.ai.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "autonomous_tasks")
data class TaskSnapshotEntity(
    @PrimaryKey
    val taskId: String,
    val originalGoal: String,
    val currentState: String, // "RUNNING", "PAUSED", "COMPLETED", "FAILED"
    val completedStepsCount: Int,
    val totalStepsCount: Int,
    val lastNarration: String,
    val updatedAt: Long = System.currentTimeMillis()
)
