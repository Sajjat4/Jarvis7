package com.bongolive.ai.service.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Path
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class MyraAccessibilityService : AccessibilityService() {

    private val actionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val actionType = intent?.getStringExtra("ACTION_TYPE") ?: return
            when (actionType) {
                "scroll_down" -> performScroll(down = true)
                "scroll_up" -> performScroll(down = false)
                "launch_app" -> {
                    val appName = intent.getStringExtra("APP_NAME") ?: return
                    launchApp(appName)
                }
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        val filter = IntentFilter(ACTION_PERFORM_GESTURE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(actionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(actionReceiver, filter)
        }
        Log.d("AccessibilityService", "Myra accessibility service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Observes screen events for universal autonomous agent
    }

    override fun onInterrupt() {
        Log.d("AccessibilityService", "Myra accessibility service interrupted")
    }

    private fun performScroll(down: Boolean) {
        val displayMetrics = resources.displayMetrics
        val width = displayMetrics.widthPixels.toFloat()
        val height = displayMetrics.heightPixels.toFloat()

        val startY = if (down) height * 0.75f else height * 0.25f
        val endY = if (down) height * 0.25f else height * 0.75f

        val path = Path().apply {
            moveTo(width / 2f, startY)
            lineTo(width / 2f, endY)
        }

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()

        dispatchGesture(gesture, null, null)
    }

    private fun launchApp(appName: String) {
        val pm = packageManager
        val launchIntent = when (appName.lowercase()) {
            "youtube" -> pm.getLaunchIntentForPackage("com.google.android.youtube")
            "camera" -> Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
            "calculator" -> Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_APP_CALCULATOR)
            else -> null
        }

        launchIntent?.let {
            it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                startActivity(it)
            } catch (e: Exception) {
                Log.e("AccessibilityService", "Error launching app: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        try {
            unregisterReceiver(actionReceiver)
        } catch (e: Exception) {}
    }

    companion object {
        const val ACTION_PERFORM_GESTURE = "com.bongolive.ai.ACTION_PERFORM_GESTURE"
        var instance: MyraAccessibilityService? = null
            private set
    }
}
