package com.bongolive.ai.data.local.dao

import androidx.room.*
import com.bongolive.ai.data.local.entity.DiagnosticErrorEntity
import com.bongolive.ai.data.local.entity.DiagnosticRunEntity
import com.bongolive.ai.data.local.entity.RecoveryAttemptEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DiagnosticDao {

    // Errors
    @Insert
    suspend fun insertError(error: DiagnosticErrorEntity): Long

    @Query("SELECT * FROM diagnostic_errors ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentErrors(limit: Int = 50): Flow<List<DiagnosticErrorEntity>>

    @Query("SELECT * FROM diagnostic_errors WHERE category = :category ORDER BY timestamp DESC")
    suspend fun getErrorsByCategory(category: String): List<DiagnosticErrorEntity>

    @Query("SELECT COUNT(*) FROM diagnostic_errors WHERE timestamp > :sinceTimestamp")
    suspend fun countErrorsSince(sinceTimestamp: Long): Int

    @Query("DELETE FROM diagnostic_errors")
    suspend fun clearErrors()

    // Diagnostic Runs
    @Insert
    suspend fun insertRun(run: DiagnosticRunEntity): Long

    @Query("SELECT * FROM diagnostic_runs ORDER BY timestamp DESC LIMIT 1")
    fun getLatestRunFlow(): Flow<DiagnosticRunEntity?>

    @Query("SELECT * FROM diagnostic_runs ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentRuns(limit: Int = 20): Flow<List<DiagnosticRunEntity>>

    @Query("DELETE FROM diagnostic_runs")
    suspend fun clearRuns()

    // Recovery Attempts
    @Insert
    suspend fun insertRecovery(recovery: RecoveryAttemptEntity): Long

    @Query("SELECT * FROM recovery_attempts ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentRecoveries(limit: Int = 30): Flow<List<RecoveryAttemptEntity>>

    @Query("SELECT COUNT(*) FROM recovery_attempts WHERE errorCategory = :category AND result = 'FAILED' AND timestamp > :sinceTimestamp")
    suspend fun countRecentFailuresForCategory(category: String, sinceTimestamp: Long): Int

    @Query("DELETE FROM recovery_attempts")
    suspend fun clearRecoveries()
}
