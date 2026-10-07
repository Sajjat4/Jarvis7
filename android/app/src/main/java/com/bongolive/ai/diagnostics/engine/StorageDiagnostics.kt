package com.bongolive.ai.diagnostics.engine

import android.os.Environment
import android.os.StatFs
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.diagnostics.model.StorageStatus

object StorageDiagnostics {

    fun inspect(): StorageStatus {
        return try {
            val stat = StatFs(Environment.getDataDirectory().path)
            val blockSize = stat.blockSizeLong
            val totalBlocks = stat.blockCountLong
            val availableBlocks = stat.availableBlocksLong

            val totalBytes = totalBlocks * blockSize
            val availableBytes = availableBlocks * blockSize
            val usedBytes = totalBytes - availableBytes

            val freePercent = if (totalBytes > 0) {
                ((availableBytes.toDouble() / totalBytes.toDouble()) * 100).toInt()
            } else 0

            val status = when {
                freePercent < 10 -> HealthStatus.CRITICAL
                freePercent <= 20 -> HealthStatus.DEGRADED
                else -> HealthStatus.HEALTHY
            }

            val totalGb = String.format("%.1f", totalBytes.toDouble() / (1024 * 1024 * 1024))
            val freeGb = String.format("%.1f", availableBytes.toDouble() / (1024 * 1024 * 1024))

            val details = "মোট মেমোরি: ${totalGb}GB, খালি আছে: ${freeGb}GB ($freePercent% মুক্ত)।"

            StorageStatus(
                totalBytes = totalBytes,
                availableBytes = availableBytes,
                usedBytes = usedBytes,
                freePercent = freePercent,
                status = status,
                details = details
            )
        } catch (e: Exception) {
            StorageStatus(
                totalBytes = 0L,
                availableBytes = 0L,
                usedBytes = 0L,
                freePercent = 0,
                status = HealthStatus.UNKNOWN,
                details = "স্টোরেজ তথ্য পড়তে ব্যর্থ: ${e.message}"
            )
        }
    }
}
