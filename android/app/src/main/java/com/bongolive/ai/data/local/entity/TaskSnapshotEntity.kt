package com.bongolive.ai.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "autonomous_tasks")
data class TaskSnapshotEntity(
    @PrimaryKey
    val taskId: String,
    val originalGoal: String,
    val currentPackage: String = "",
    val currentStep: Int = 0,
    val totalStepsCount: Int = 1,
    val lastObservation: String = "",
    val lastSuccessfulAction: String = "",
    val failedAction: String? = null,
    val retryCount: Int = 0,
    val currentState: String = "RUNNING", // RUNNING, PAUSED, COMPLETED, FAILED, STOPPED
    val isConsequential: Boolean = false,
    val isConfirmed: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
)
