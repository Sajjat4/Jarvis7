package com.bongolive.ai.service.screen

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Binder
import android.os.IBinder
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.bongolive.ai.BongoLiveApp
import com.bongolive.ai.MainActivity
import com.bongolive.ai.service.GeminiLiveService
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.ByteArrayOutputStream

class ScreenCaptureService : Service() {

    private val binder = LocalBinder()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var streamingJob: Job? = null

    private var screenWidth = 720
    private var screenHeight = 1280
    private var screenDensity = 320

    private val _isCapturing = MutableStateFlow(false)
    val isCapturing = _isCapturing.asStateFlow()

    inner class LocalBinder : Binder() {
        fun getService(): ScreenCaptureService = this@ScreenCaptureService
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        wm.defaultDisplay.getRealMetrics(metrics)

        // Scale resolution appropriately for responsive multimodal AI transmission
        val scale = 720f / maxOf(metrics.widthPixels, 1)
        screenWidth = (metrics.widthPixels * scale).toInt()
        screenHeight = (metrics.heightPixels * scale).toInt()
        screenDensity = metrics.densityDpi
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)

        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
        val resultData = intent?.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)

        if (resultCode != 0 && resultData != null) {
            val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)

            // Respect user runtime permissions and handle system-initiated revocation
            mediaProjection?.registerCallback(object : MediaProjection.Callback() {
                override fun onStop() {
                    Log.d(TAG, "MediaProjection stopped by system or user revocation")
                    stopScreenCapture()
                }
            }, null)

            setupVirtualDisplay()
        }

        return START_NOT_STICKY
    }

    private fun setupVirtualDisplay() {
        val mp = mediaProjection ?: return

        imageReader = ImageReader.newInstance(
            screenWidth,
            screenHeight,
            PixelFormat.RGBA_8888,
            2
        )

        virtualDisplay = mp.createVirtualDisplay(
            "MyraScreenCapture",
            screenWidth,
            screenHeight,
            screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )
        _isCapturing.value = true
        Log.d(TAG, "VirtualDisplay established: ${screenWidth}x${screenHeight} @ ${screenDensity}dpi")
    }

    /**
     * Starts continuous background visual frame streaming to GeminiLiveService.
     */
    fun startLiveVisionStream(intervalMs: Long = 1000L) {
        streamingJob?.cancel()
        streamingJob = scope.launch {
            while (isActive && _isCapturing.value) {
                val jpeg = captureScreenJpeg()
                if (jpeg != null) {
                    GeminiLiveService.instance?.sendVisualFrame(jpeg)
                }
                delay(intervalMs)
            }
        }
    }

    fun stopLiveVisionStream() {
        streamingJob?.cancel()
        streamingJob = null
    }

    /**
     * Captures current physical screen frame and encodes to compressed JPEG ByteArray for AI visual analysis.
     */
    suspend fun captureScreenJpeg(): ByteArray? = withContext(Dispatchers.IO) {
        val reader = imageReader ?: return@withContext null
        val image = reader.acquireLatestImage() ?: reader.acquireNextImage() ?: return@withContext null

        try {
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * screenWidth

            val bitmap = Bitmap.createBitmap(
                screenWidth + rowPadding / pixelStride,
                screenHeight,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            val cleanBitmap = if (rowPadding != 0) {
                Bitmap.createBitmap(bitmap, 0, 0, screenWidth, screenHeight)
            } else {
                bitmap
            }

            val baos = ByteArrayOutputStream()
            cleanBitmap.compress(Bitmap.CompressFormat.JPEG, 75, baos)
            baos.toByteArray()
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring and encoding screen frame: ${e.message}")
            null
        } finally {
            image.close()
        }
    }

    fun stopScreenCapture() {
        stopLiveVisionStream()
        _isCapturing.value = false
        virtualDisplay?.release()
        virtualDisplay = null
        imageReader?.close()
        imageReader = null
        mediaProjection?.stop()
        mediaProjection = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, BongoLiveApp.CHANNEL_LIVE_VOICE)
            .setContentTitle("BongoLive স্ক্রিন ভিজ্যুয়াল ইন্সপেকশন")
            .setContentText("স্ক্রিন দেখে স্বয়ংক্রিয় কাজের ফলাফল পর্যবেক্ষণ করা হচ্ছে...")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onDestroy() {
        super.onDestroy()
        stopScreenCapture()
        scope.cancel()
        instance = null
    }

    companion object {
        const val TAG = "ScreenCaptureService"
        const val NOTIFICATION_ID = 1002
        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"

        var instance: ScreenCaptureService? = null
            private set
    }
}
