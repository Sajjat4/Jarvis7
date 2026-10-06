package com.bongolive.ai.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.bongolive.ai.data.local.entity.TaskSnapshotEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {

    @Query("SELECT * FROM autonomous_tasks ORDER BY updatedAt DESC LIMIT 1")
    fun getLatestTaskFlow(): Flow<TaskSnapshotEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveTask(task: TaskSnapshotEntity)

    @Query("DELETE FROM autonomous_tasks WHERE taskId = :taskId")
    suspend fun deleteTask(taskId: String)

    @Query("DELETE FROM autonomous_tasks")
    suspend fun clearAllTasks()
}
