package com.bongolive.ai.service.autonomous

import android.util.Base64
import android.util.Log
import com.bongolive.ai.data.local.dao.DiagnosticDao
import com.bongolive.ai.data.local.dao.ExecutionLogDao
import com.bongolive.ai.data.local.dao.TaskDao
import com.bongolive.ai.data.local.entity.ExecutionLogEntity
import com.bongolive.ai.data.local.entity.TaskSnapshotEntity
import com.bongolive.ai.data.remote.GeminiApiClient
import com.bongolive.ai.data.remote.model.ChatApiRequest
import com.bongolive.ai.diagnostics.analyzer.SelfErrorDetector
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.service.accessibility.MyraAccessibilityService
import com.bongolive.ai.service.screen.ScreenCaptureService
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

enum class TaskStatus {
    IDLE,
    RUNNING,
    PAUSED,
    AWAITING_CONFIRMATION,
    COMPLETED,
    FAILED,
    STOPPED
}

class AutonomousTaskController(
    private val taskDao: TaskDao,
    private val executionLogDao: ExecutionLogDao,
    private val diagnosticDao: DiagnosticDao? = null
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var activeJob: Job? = null

    private val _taskStatus = MutableStateFlow(TaskStatus.IDLE)
    val taskStatus = _taskStatus.asStateFlow()

    private val _currentTask = MutableStateFlow<TaskSnapshotEntity?>(null)
    val currentTask = _currentTask.asStateFlow()

    private val _narrationText = MutableStateFlow("")
    val narrationText = _narrationText.asStateFlow()

    private var isPaused = false

    /**
     * Starts an autonomous goal execution loop.
     */
    fun startTask(goal: String, apiKey: String?) {
        stopTask()
        isPaused = false
        val taskId = UUID.randomUUID().toString()

        val initialSnapshot = TaskSnapshotEntity(
            taskId = taskId,
            originalGoal = goal,
            currentState = "RUNNING",
            currentStep = 0,
            totalStepsCount = 5
        )

        _currentTask.value = initialSnapshot
        _taskStatus.value = TaskStatus.RUNNING

        activeJob = scope.launch {
            taskDao.saveTask(initialSnapshot)
            log(taskId, "GOAL", "নতুন টাস্ক শুরু: $goal", "SUCCESS")

            // OPTIONAL LIGHT PREFLIGHT CHECK
            val accessibilityService = MyraAccessibilityService.instance
            if (accessibilityService == null || !accessibilityService.isServiceActive.value) {
                val preflightMsg = "এই কাজের জন্য Accessibility Service দরকার। এটা এখন বন্ধ আছে। আমি Settings খুলে দিতে পারি।"
                log(taskId, "PREFLIGHT_FAIL", preflightMsg, "FAILURE")
                SelfErrorDetector.recordError(
                    scope = scope,
                    diagnosticDao = diagnosticDao,
                    source = "AutonomousTaskController::Preflight",
                    message = preflightMsg,
                    technicalDetails = "Accessibility Service instance is null or inactive",
                    relatedTaskId = taskId,
                    severity = HealthStatus.ERROR
                )
                failTask(taskId, preflightMsg)
                return@launch
            }

            executeAutonomousLoop(taskId, goal, apiKey)
        }
    }

    private suspend fun executeAutonomousLoop(taskId: String, goal: String, apiKey: String?) {
        val maxSteps = 8
        var currentStep = 0
        var consecutiveFailures = 0

        while (currentStep < maxSteps && _taskStatus.value == TaskStatus.RUNNING) {
            // Handle Pause
            while (isPaused && _taskStatus.value == TaskStatus.PAUSED) {
                delay(500)
            }
            if (_taskStatus.value != TaskStatus.RUNNING) break

            currentStep++
            log(taskId, "DECISION", "ধাপ $currentStep পরিকল্পনা করা হচ্ছে...", "INFO")

            // 1. SCREEN OBSERVATION
            val screenBytes = ScreenCaptureService.instance?.captureScreenJpeg()
            val screenBase64 = screenBytes?.let { Base64.encodeToString(it, Base64.NO_WRAP) }
            val nodes = MyraAccessibilityService.instance?.dumpVisibleNodes() ?: emptyList()
            val visibleTextSummary = nodes.joinToString(", ") { it.text.ifBlank { it.contentDescription } }.take(300)

            log(taskId, "OBSERVATION", "স্ক্রিন দেখা হলো। দৃশ্যমান উপাদান: $visibleTextSummary", "SUCCESS")

            // 2. AI DECISION & TARGET IDENTIFICATION
            val prompt = """
                লক্ষ্য: $goal
                বর্তমান ধাপ: $currentStep
                স্ক্রিনের দৃশ্যমান উপাদান: $visibleTextSummary
                
                পরবর্তী পদক্ষেপ কী হওয়া উচিত? শুধুমাত্র নিচের একটি কমান্ড ফরম্যাটে উত্তর দিন:
                - [ACTION:click_text:TargetText]
                - [ACTION:type_text:TextToType]
                - [ACTION:scroll_down]
                - [ACTION:scroll_up]
                - [ACTION:launch_app:AppName]
                - [ACTION:back]
                - [ACTION:complete:কারণ]
            """.trimIndent()

            val aiResponse = try {
                GeminiApiClient.apiService.sendChatMessage(
                    ChatApiRequest(
                        prompt = prompt,
                        customApiKey = apiKey,
                        imageBase64 = screenBase64
                    )
                )
            } catch (e: Exception) {
                log(taskId, "DECISION", "AI সাথে যোগাযোগে ব্যর্থ: ${e.message}", "FAILURE")
                consecutiveFailures++
                if (consecutiveFailures >= 3) {
                    failTask(taskId, "AI প্রতিক্রিয়া দিতে ব্যর্থ হয়েছে।")
                    return
                }
                delay(2000)
                continue
            }

            val text = aiResponse.text
            _narrationText.value = text
            log(taskId, "TARGET", "AI সিদ্ধান্ত: $text", "INFO")

            if (text.contains("[ACTION:complete", ignoreCase = true)) {
                completeTask(taskId, "লক্ষ্য সফলভাবে সম্পন্ন হয়েছে!")
                return
            }

            // 3. ACTION DISPATCH
            val actionSuccess = dispatchAction(text)
            log(
                taskId,
                "ACTION",
                "অ্যাকশন কার্যকর করা হয়েছে ($text)",
                if (actionSuccess) "SUCCESS" else "RETRY"
            )

            // 4. VERIFICATION AFTER ACTION
            delay(1500) // Allow UI transition
            val afterNodes = MyraAccessibilityService.instance?.dumpVisibleNodes() ?: emptyList()
            val isUiChanged = afterNodes.size != nodes.size || afterNodes.firstOrNull()?.text != nodes.firstOrNull()?.text

            if (isUiChanged || actionSuccess) {
                consecutiveFailures = 0
                log(taskId, "VERIFICATION", "স্ক্রিনের পরিবর্তন সফলভাবে যাচাই করা হয়েছে।", "SUCCESS")
            } else {
                consecutiveFailures++
                log(taskId, "VERIFICATION", "স্ক্রিনে প্রত্যাশিত পরিবর্তন দেখা যায়নি। পুনরায় চেষ্টা হচ্ছে...", "RETRY")
                if (consecutiveFailures >= 3) {
                    failTask(taskId, "টাস্ক সম্পন্ন করা যায়নি (বারংবার ব্যর্থতা)।")
                    return
                }
            }

            // Update Snapshot in Room
            val updated = _currentTask.value?.copy(
                currentStep = currentStep,
                lastObservation = visibleTextSummary,
                lastSuccessfulAction = text,
                updatedAt = System.currentTimeMillis()
            )
            if (updated != null) {
                _currentTask.value = updated
                taskDao.saveTask(updated)
            }
        }

        if (_taskStatus.value == TaskStatus.RUNNING) {
            completeTask(taskId, "সর্বোচ্চ সংখ্যক পদক্ষেপ সম্পন্ন হয়েছে।")
        }
    }

    private fun dispatchAction(actionStr: String): Boolean {
        val service = MyraAccessibilityService.instance ?: return false

        return when {
            actionStr.contains("click_text:", ignoreCase = true) -> {
                val target = actionStr.substringAfter("click_text:").substringBefore("]").trim()
                val clicked = service.clickNodeByText(target)
                if (!clicked) {
                    // Fallback to gesture tap on matching node bounds center
                    val match = service.dumpVisibleNodes().firstOrNull {
                        it.text.contains(target, ignoreCase = true) || it.contentDescription.contains(target, ignoreCase = true)
                    }
                    if (match != null && match.bounds.width() > 0) {
                        service.tapCoordinates(match.bounds.centerX().toFloat(), match.bounds.centerY().toFloat())
                    } else false
                } else true
            }
            actionStr.contains("type_text:", ignoreCase = true) -> {
                val text = actionStr.substringAfter("type_text:").substringBefore("]").trim()
                service.setTextOnFocusedOrFirstEditable(text)
            }
            actionStr.contains("scroll_down", ignoreCase = true) -> service.performScroll(down = true)
            actionStr.contains("scroll_up", ignoreCase = true) -> service.performScroll(down = false)
            actionStr.contains("launch_app:", ignoreCase = true) -> {
                val app = actionStr.substringAfter("launch_app:").substringBefore("]").trim()
                service.launchApp(app)
            }
            actionStr.contains("back", ignoreCase = true) -> service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
            else -> false
        }
    }

    fun pauseTask() {
        isPaused = true
        _taskStatus.value = TaskStatus.PAUSED
        _currentTask.value?.let {
            scope.launch {
                val updated = it.copy(currentState = "PAUSED")
                _currentTask.value = updated
                taskDao.saveTask(updated)
                log(it.taskId, "PAUSED", "টাস্ক সাময়িক স্থগিত রাখা হয়েছে।", "PAUSED")
            }
        }
    }

    fun resumeTask() {
        isPaused = false
        _taskStatus.value = TaskStatus.RUNNING
        _currentTask.value?.let {
            scope.launch {
                val updated = it.copy(currentState = "RUNNING")
                _currentTask.value = updated
                taskDao.saveTask(updated)
                log(it.taskId, "RESUMED", "টাস্ক পুনরায় শুরু করা হয়েছে।", "RESUMED")
            }
        }
    }

    fun stopTask() {
        activeJob?.cancel()
        activeJob = null
        isPaused = false
        _taskStatus.value = TaskStatus.STOPPED
        _currentTask.value?.let {
            scope.launch {
                val updated = it.copy(currentState = "STOPPED")
                _currentTask.value = updated
                taskDao.saveTask(updated)
                log(it.taskId, "STOPPED", "টাস্ক ব্যবহারকারী কর্তৃক থামানো হয়েছে।", "STOPPED")
            }
        }
    }

    private suspend fun completeTask(taskId: String, msg: String) {
        _taskStatus.value = TaskStatus.COMPLETED
        _narrationText.value = msg
        val updated = _currentTask.value?.copy(currentState = "COMPLETED") ?: return
        _currentTask.value = updated
        taskDao.saveTask(updated)
        log(taskId, "RESULT", msg, "SUCCESS")
    }

    private suspend fun failTask(taskId: String, reason: String) {
        _taskStatus.value = TaskStatus.FAILED
        _narrationText.value = reason
        val updated = _currentTask.value?.copy(currentState = "FAILED") ?: return
        _currentTask.value = updated
        taskDao.saveTask(updated)
        log(taskId, "RESULT", reason, "FAILURE")
    }

    private suspend fun log(taskId: String, stage: String, desc: String, status: String) {
        Log.d(TAG, "[$stage][$status] $desc")
        executionLogDao.insertLog(
            ExecutionLogEntity(
                taskId = taskId,
                stage = stage,
                description = desc,
                status = status
            )
        )
    }

    companion object {
        private const val TAG = "AutonomousController"
    }
}
