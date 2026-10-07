package com.bongolive.ai.service.floating

import android.annotation.SuppressLint
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.view.*
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.bongolive.ai.MainActivity

class FloatingAssistantService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var params: WindowManager.LayoutParams? = null

    private var isExpanded = false

    override fun onCreate() {
        super.onCreate()
        instance = this
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createFloatingView()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Restructured as a standard started Service for WindowManager overlay.
        // It does not call startForeground(), completely preventing MissingForegroundServiceTypeException on Android 14+.
        if (floatingView == null) {
            createFloatingView()
        }
        return START_STICKY
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun createFloatingView() {
        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 20
            y = 200
        }

        // Programmatically build sleek floating orb view with expansion panel
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
        }

        // Main Orb Icon
        val orbIcon = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_btn_speak_now)
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#10B981"))
                setStroke(4, Color.parseColor("#34D399"))
            }
            background = bg
            setPadding(24, 24, 24, 24)
            layoutParams = LinearLayout.LayoutParams(120, 120)
        }

        // Expanded Control Card
        val controlCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            val cardBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 32f
                setColor(Color.parseColor("#18181B"))
                setStroke(2, Color.parseColor("#3F3F46"))
            }
            background = cardBg
            setPadding(32, 24, 32, 24)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 16 }
        }

        val title = TextView(this).apply {
            text = "MYRA সহকারী"
            setTextColor(Color.WHITE)
            textSize = 12f
        }
        controlCard.addView(title)

        // Action Buttons
        val btnRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 12 }
        }

        // Open App Button
        val btnOpen = TextView(this).apply {
            text = "অ্যাপ"
            setTextColor(Color.parseColor("#10B981"))
            textSize = 11f
            setPadding(16, 8, 16, 8)
            setOnClickListener {
                val appIntent = Intent(this@FloatingAssistantService, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(appIntent)
            }
        }
        btnRow.addView(btnOpen)

        // Close Floating Button
        val btnClose = TextView(this).apply {
            text = "বন্ধ"
            setTextColor(Color.parseColor("#F87171"))
            textSize = 11f
            setPadding(16, 8, 16, 8)
            setOnClickListener {
                stopSelf()
            }
        }
        btnRow.addView(btnClose)
        controlCard.addView(btnRow)

        rootLayout.addView(orbIcon)
        rootLayout.addView(controlCard)

        // Drag & Click Logic
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var isMoved = false

        orbIcon.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params!!.x
                    initialY = params!!.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isMoved = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                        isMoved = true
                    }
                    params!!.x = initialX + dx
                    params!!.y = initialY + dy
                    windowManager?.updateViewLayout(rootLayout, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isMoved) {
                        isExpanded = !isExpanded
                        controlCard.visibility = if (isExpanded) View.VISIBLE else View.GONE
                    }
                    true
                }
                else -> false
            }
        }

        floatingView = rootLayout
        windowManager?.addView(floatingView, params)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        if (floatingView != null) {
            windowManager?.removeView(floatingView)
            floatingView = null
        }
        instance = null
    }

    companion object {
        var instance: FloatingAssistantService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }
}
