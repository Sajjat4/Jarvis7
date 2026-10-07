package com.bongolive.ai.diagnostics.engine

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.PowerManager
import com.bongolive.ai.diagnostics.model.BatteryStatus
import com.bongolive.ai.diagnostics.model.HealthStatus

object BatteryDiagnostics {

    fun inspect(context: Context): BatteryStatus {
        val batteryIntent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager

        val isPowerSaveMode = powerManager?.isPowerSaveMode ?: false
        val isBatteryOptimizationIgnored = powerManager?.isIgnoringBatteryOptimizations(context.packageName) ?: false

        if (batteryIntent == null) {
            return BatteryStatus(
                levelPercent = 0,
                isCharging = false,
                chargingSource = "None",
                temperatureCelsius = 0f,
                voltageMv = 0,
                healthState = "অজ্ঞাত",
                isPowerSaveMode = isPowerSaveMode,
                isBatteryOptimizationIgnored = isBatteryOptimizationIgnored,
                status = HealthStatus.UNKNOWN,
                details = "BatteryManager ডাটা পাওয়া যায়নি।"
            )
        }

        val level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val levelPercent = if (level >= 0 && scale > 0) ((level.toFloat() / scale.toFloat()) * 100).toInt() else 0

        val statusInt = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val isCharging = statusInt == BatteryManager.BATTERY_STATUS_CHARGING || statusInt == BatteryManager.BATTERY_STATUS_FULL

        val chargePlug = batteryIntent.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1)
        val chargingSource = when (chargePlug) {
            BatteryManager.BATTERY_PLUGGED_AC -> "AC চার্জার"
            BatteryManager.BATTERY_PLUGGED_USB -> "USB পোর্ট"
            BatteryManager.BATTERY_PLUGGED_WIRELESS -> "ওয়্যারলেস"
            else -> if (isCharging) "চার্জিং" else "ব্যাটারি ড্রেন"
        }

        val tempTenths = batteryIntent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0)
        val temperatureCelsius = tempTenths / 10.0f
        val voltageMv = batteryIntent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0)

        val healthInt = batteryIntent.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)
        val healthState = when (healthInt) {
            BatteryManager.BATTERY_HEALTH_GOOD -> "ভালো (Good)"
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "অতিরিক্ত গরম (Overheat)"
            BatteryManager.BATTERY_HEALTH_DEAD -> "অকার্যকর (Dead)"
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "উচ্চ ভোল্টেজ (Over Voltage)"
            else -> "সাধারণ"
        }

        val status = when {
            levelPercent <= 12 && !isCharging -> HealthStatus.CRITICAL
            levelPercent <= 20 && !isCharging -> HealthStatus.DEGRADED
            temperatureCelsius >= 45.0f -> HealthStatus.DEGRADED
            isPowerSaveMode -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY
        }

        val details = buildString {
            append("চার্জ: $levelPercent% ($chargingSource)")
            if (isPowerSaveMode) append(" | পাওয়ার সেভার সক্রিয়")
            if (temperatureCelsius > 0f) append(" | তাপমাত্রা: ${temperatureCelsius}°C")
            if (!isBatteryOptimizationIgnored) append(" | ব্যাটারি অপটিমাইজেশন সক্রিয় (ব্যাকগ্রাউন্ড লিমিট হতে পারে)")
        }

        return BatteryStatus(
            levelPercent = levelPercent,
            isCharging = isCharging,
            chargingSource = chargingSource,
            temperatureCelsius = temperatureCelsius,
            voltageMv = voltageMv,
            healthState = healthState,
            isPowerSaveMode = isPowerSaveMode,
            isBatteryOptimizationIgnored = isBatteryOptimizationIgnored,
            status = status,
            details = details
        )
    }
}
