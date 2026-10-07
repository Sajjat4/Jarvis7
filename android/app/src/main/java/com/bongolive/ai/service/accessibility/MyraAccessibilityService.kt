package com.bongolive.ai.service.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

data class NodeSummary(
    val text: String,
    val contentDescription: String,
    val viewId: String,
    val className: String,
    val isClickable: Boolean,
    val isEditable: Boolean,
    val isScrollable: Boolean,
    val bounds: Rect,
    val depth: Int = 0
)

class MyraAccessibilityService : AccessibilityService() {

    private val gson = Gson()

    private val _isServiceActive = MutableStateFlow(false)
    val isServiceActive = _isServiceActive.asStateFlow()

    private val _currentActivePackage = MutableStateFlow("")
    val currentActivePackage = _currentActivePackage.asStateFlow()

    private val _currentActiveActivity = MutableStateFlow("")
    val currentActiveActivity = _currentActiveActivity.asStateFlow()

    private val _lastUiChangeTimestamp = MutableStateFlow(System.currentTimeMillis())
    val lastUiChangeTimestamp = _lastUiChangeTimestamp.asStateFlow()

    private val actionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val actionType = intent?.getStringExtra("ACTION_TYPE") ?: return
            val target = intent.getStringExtra("TARGET") ?: ""
            val param = intent.getStringExtra("PARAM") ?: ""

            when (actionType) {
                "click_text" -> clickNodeByText(target)
                "click_id" -> clickNodeById(target)
                "type_text" -> setTextOnFocusedOrFirstEditable(param)
                "scroll_down" -> performScroll(down = true)
                "scroll_up" -> performScroll(down = false)
                "back" -> performGlobalAction(GLOBAL_ACTION_BACK)
                "home" -> performGlobalAction(GLOBAL_ACTION_HOME)
                "recents" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
                "launch_app" -> launchApp(target.ifBlank { param })
                "tap_coordinates" -> {
                    val x = intent.getFloatExtra("X", 0f)
                    val y = intent.getFloatExtra("Y", 0f)
                    tapCoordinates(x, y)
                }
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        _isServiceActive.value = true

        val filter = IntentFilter(ACTION_PERFORM_GESTURE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(actionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(actionReceiver, filter)
        }
        Log.d(TAG, "Myra Accessibility Service connected and initialized")
    }

    /**
     * Complete onAccessibilityEvent handler for tracking window state changes,
     * content updates, and user interactions across external Android apps.
     */
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val pkg = event.packageName?.toString() ?: ""
                val cls = event.className?.toString() ?: ""
                if (pkg.isNotBlank()) {
                    _currentActivePackage.value = pkg
                }
                if (cls.isNotBlank()) {
                    _currentActiveActivity.value = cls
                }
                _lastUiChangeTimestamp.value = System.currentTimeMillis()
                Log.d(TAG, "Window state changed: pkg=$pkg, cls=$cls")
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                _lastUiChangeTimestamp.value = System.currentTimeMillis()
            }
            AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                Log.d(TAG, "Observed click event on: ${event.className} in ${event.packageName}")
                _lastUiChangeTimestamp.value = System.currentTimeMillis()
            }
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                _lastUiChangeTimestamp.value = System.currentTimeMillis()
            }
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                _lastUiChangeTimestamp.value = System.currentTimeMillis()
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Myra Accessibility Service interrupted")
        _isServiceActive.value = false
    }

    /**
     * Traverses visible UI hierarchy and extracts actionable and descriptive nodes.
     */
    fun dumpVisibleNodes(): List<NodeSummary> {
        val root = rootInActiveWindow ?: return emptyList()
        val result = mutableListOf<NodeSummary>()
        traverseNode(root, result, depth = 0)
        return result
    }

    private fun traverseNode(node: AccessibilityNodeInfo?, outList: MutableList<NodeSummary>, depth: Int) {
        if (node == null) return

        val text = node.text?.toString() ?: ""
        val contentDesc = node.contentDescription?.toString() ?: ""
        val viewId = node.viewIdResourceName ?: ""
        val className = node.className?.toString() ?: ""
        val isClickable = node.isClickable
        val isEditable = node.isEditable
        val isScrollable = node.isScrollable

        val bounds = Rect()
        node.getBoundsInScreen(bounds)

        if (text.isNotBlank() || contentDesc.isNotBlank() || isClickable || isEditable || isScrollable) {
            outList.add(
                NodeSummary(
                    text = text,
                    contentDescription = contentDesc,
                    viewId = viewId,
                    className = className,
                    isClickable = isClickable,
                    isEditable = isEditable,
                    isScrollable = isScrollable,
                    bounds = bounds,
                    depth = depth
                )
            )
        }

        for (i in 0 until node.childCount) {
            traverseNode(node.getChild(i), outList, depth + 1)
        }
    }

    /**
     * Produces a structured JSON dump of visible screen nodes for AI multimodal reasoning.
     */
    fun buildHierarchyTreeJson(): String {
        val root = rootInActiveWindow ?: return "{}"
        val rootObj = JsonObject().apply {
            addProperty("packageName", root.packageName?.toString() ?: "")
            addProperty("className", root.className?.toString() ?: "")
            val childrenArray = JsonArray()
            buildJsonSubtree(root, childrenArray)
            add("children", childrenArray)
        }
        return gson.toJson(rootObj)
    }

    private fun buildJsonSubtree(node: AccessibilityNodeInfo?, outArray: JsonArray) {
        if (node == null) return

        val nodeObj = JsonObject().apply {
            node.text?.let { addProperty("text", it.toString()) }
            node.contentDescription?.let { addProperty("contentDescription", it.toString()) }
            node.viewIdResourceName?.let { addProperty("viewId", it) }
            addProperty("className", node.className?.toString() ?: "")
            addProperty("clickable", node.isClickable)
            addProperty("editable", node.isEditable)
            val bounds = Rect()
            node.getBoundsInScreen(bounds)
            addProperty("bounds", "${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}")
        }
        outArray.add(nodeObj)

        for (i in 0 until node.childCount) {
            buildJsonSubtree(node.getChild(i), outArray)
        }
    }

    /**
     * Semantic target matching and click execution.
     */
    fun clickNodeByText(targetText: String): Boolean {
        val root = rootInActiveWindow ?: return false

        // 1. Direct search by text in system nodes
        val nodes = root.findAccessibilityNodeInfosByText(targetText)
        if (!nodes.isNullOrEmpty()) {
            for (node in nodes) {
                if (performClickOnNode(node)) {
                    Log.d(TAG, "Successfully clicked node matching text: $targetText")
                    return true
                }
            }
        }

        // 2. Semantic fuzzy search in dump
        val dump = dumpVisibleNodes()
        val match = dump.find {
            it.text.contains(targetText, ignoreCase = true) ||
            it.contentDescription.contains(targetText, ignoreCase = true)
        }
        if (match != null) {
            val centerX = match.bounds.exactCenterX()
            val centerY = match.bounds.exactCenterY()
            Log.d(TAG, "Found semantic match for '$targetText', tapping ($centerX, $centerY)")
            return tapCoordinates(centerX, centerY)
        }

        return false
    }

    /**
     * Climbs up parent hierarchy to find first clickable container.
     */
    private fun performClickOnNode(node: AccessibilityNodeInfo): Boolean {
        var current: AccessibilityNodeInfo? = node
        while (current != null) {
            if (current.isClickable) {
                return current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            current = current.parent
        }
        // Fallback: tap coordinate center
        val bounds = Rect()
        node.getBoundsInScreen(bounds)
        if (!bounds.isEmpty) {
            return tapCoordinates(bounds.exactCenterX(), bounds.exactCenterY())
        }
        return false
    }

    /**
     * Clicks an element matching viewId resource name.
     */
    fun clickNodeById(viewId: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
        if (!nodes.isNullOrEmpty()) {
            for (node in nodes) {
                if (performClickOnNode(node)) return true
            }
        }
        return false
    }

    /**
     * Injects text into currently focused editable field or searches for first editable input box.
     */
    fun setTextOnFocusedOrFirstEditable(text: String): Boolean {
        val root = rootInActiveWindow ?: return false

        // 1. Try finding focused input
        val focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        if (focused != null && (focused.isEditable || focused.isFocusable)) {
            val args = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
            }
            val success = focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
            if (success) {
                Log.d(TAG, "Set text on focused input: $text")
                return true
            }
        }

        // 2. Search all nodes for an editable node
        val editable = findFirstEditableNode(root)
        if (editable != null) {
            editable.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
            val args = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
            }
            val success = editable.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
            if (success) {
                Log.d(TAG, "Set text on first editable node: $text")
                return true
            }
        }

        return false
    }

    private fun findFirstEditableNode(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        if (node == null) return null
        if (node.isEditable) return node
        for (i in 0 until node.childCount) {
            val child = findFirstEditableNode(node.getChild(i))
            if (child != null) return child
        }
        return null
    }

    /**
     * Performs a scrolling gesture.
     */
    fun performScroll(down: Boolean): Boolean {
        val root = rootInActiveWindow
        val scrollable = findFirstScrollableNode(root)

        if (scrollable != null) {
            val action = if (down) {
                AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
            } else {
                AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
            }
            val res = scrollable.performAction(action)
            if (res) return true
        }

        // Fallback to gesture swipe
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

        return dispatchGesture(gesture, null, null)
    }

    private fun findFirstScrollableNode(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        if (node == null) return null
        if (node.isScrollable) return node
        for (i in 0 until node.childCount) {
            val child = findFirstScrollableNode(node.getChild(i))
            if (child != null) return child
        }
        return null
    }

    /**
     * Taps physical coordinates on the screen.
     */
    fun tapCoordinates(x: Float, y: Float): Boolean {
        val path = Path().apply {
            moveTo(x, y)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, 80)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
        return dispatchGesture(gesture, null, null)
    }

    /**
     * Launches any installed Android application by package name or common app name.
     */
    fun launchApp(appNameOrPackage: String): Boolean {
        val pm = packageManager
        var launchIntent = pm.getLaunchIntentForPackage(appNameOrPackage)

        if (launchIntent == null) {
            val apps = pm.getInstalledApplications(0)
            for (app in apps) {
                val label = pm.getApplicationLabel(app).toString()
                if (label.equals(appNameOrPackage, ignoreCase = true) ||
                    label.contains(appNameOrPackage, ignoreCase = true)) {
                    launchIntent = pm.getLaunchIntentForPackage(app.packageName)
                    break
                }
            }
        }

        if (launchIntent == null) {
            launchIntent = when (appNameOrPackage.lowercase()) {
                "youtube" -> pm.getLaunchIntentForPackage("com.google.android.youtube")
                "camera" -> Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
                "calculator" -> Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_APP_CALCULATOR)
                "chrome" -> pm.getLaunchIntentForPackage("com.android.chrome")
                "whatsapp" -> pm.getLaunchIntentForPackage("com.whatsapp")
                "telegram" -> pm.getLaunchIntentForPackage("org.telegram.messenger")
                else -> null
            }
        }

        return if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                startActivity(launchIntent)
                true
            } catch (e: Exception) {
                Log.e(TAG, "Error launching app $appNameOrPackage: ${e.message}")
                false
            }
        } else {
            false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        _isServiceActive.value = false
        instance = null
        try {
            unregisterReceiver(actionReceiver)
        } catch (e: Exception) {}
    }

    companion object {
        const val TAG = "MyraAccessibility"
        const val ACTION_PERFORM_GESTURE = "com.bongolive.ai.ACTION_PERFORM_GESTURE"
        var instance: MyraAccessibilityService? = null
            private set
    }
}
