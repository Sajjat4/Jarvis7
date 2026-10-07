package com.bongolive.ai.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.bongolive.ai.data.local.entity.ExecutionLogEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ExecutionLogDao {

    @Query("SELECT * FROM execution_logs ORDER BY timestamp DESC")
    fun getAllLogsFlow(): Flow<List<ExecutionLogEntity>>

    @Query("SELECT * FROM execution_logs WHERE taskId = :taskId ORDER BY timestamp ASC")
    fun getLogsForTaskFlow(taskId: String): Flow<List<ExecutionLogEntity>>

    @Query("SELECT * FROM execution_logs WHERE taskId = :taskId ORDER BY timestamp ASC")
    suspend fun getLogsForTask(taskId: String): List<ExecutionLogEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: ExecutionLogEntity)

    @Query("DELETE FROM execution_logs WHERE taskId = :taskId")
    suspend fun deleteLogsForTask(taskId: String)

    @Query("DELETE FROM execution_logs")
    suspend fun clearAllLogs()
}
