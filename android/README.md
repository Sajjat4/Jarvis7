# BongoLive AI - Complete Real Native Android Assistant

BongoLive AI (MYRA) is a 100% native Android autonomous voice and screen assistant built with Kotlin, Jetpack Compose, Material 3, and native Android OS APIs.

## 🌟 Native Features

1. **Direct Gemini Live BidiGenerateContent**:
   - Native bidirectional WebSocket connection directly to Google's Gemini Live API (`wss://generativelanguage.googleapis.com/...`).
   - Streams 16 kHz 16-bit PCM microphone audio using `android.media.AudioRecord`.
   - Real-time 24 kHz speech playback using `android.media.AudioTrack` with instant flush on speech interruption.
   - Low-latency live transcription and speech captions.

2. **Real Accessibility Automation**:
   - `MyraAccessibilityService` traverses the visible `AccessibilityNodeInfo` UI hierarchy.
   - Semantic target matching by text, content description, or view ID.
   - Performs `ACTION_CLICK`, `ACTION_SET_TEXT`, `ACTION_FOCUS`, `ACTION_SCROLL_FORWARD`, `ACTION_SCROLL_BACKWARD`, and `dispatchGesture`.
   - Global actions: `GLOBAL_ACTION_BACK`, `GLOBAL_ACTION_HOME`, `GLOBAL_ACTION_RECENTS`.
   - Native app launching via `PackageManager.getLaunchIntentForPackage`.

3. **Screen Inspection & Vision (MediaProjection)**:
   - `ScreenCaptureService`: Android Foreground Service with `foregroundServiceType="mediaProjection"`.
   - Uses `VirtualDisplay` and `ImageReader` to capture real device screen frames.
   - Encodes frames to JPEG for Gemini multimodal visual reasoning before and after actions.

4. **Autonomous Action Loop**:
   - Execution Loop: `Goal → AI Decision → Screen Observation → Target Identification → Action → Result → Verification → Next Action`.
   - Retries with safe alternatives on failure (up to 3 retries).
   - Supports `START`, `PAUSE`, `RESUME`, `STOP`.

5. **System-Level Floating Assistant Overlay**:
   - `FloatingAssistantService` using `WindowManager` and `TYPE_APPLICATION_OVERLAY`.
   - Draggable floating assistant bubble accessible over any other app on the device.

6. **Real Android Permission Flow**:
   - Proper system runtime permission prompts for Microphone and Notifications.
   - Direct system settings redirects for Accessibility (`Settings.ACTION_ACCESSIBILITY_SETTINGS`) and Overlay (`Settings.ACTION_MANAGE_OVERLAY_PERMISSION`).
   - MediaProjection user consent dialog via `MediaProjectionManager.createScreenCaptureIntent()`.

7. **Persistence & Execution Logs**:
   - **Room Database**:
     - `chat_messages`: Persistent conversation history with grounding metadata.
     - `app_settings`: Persistent settings backup.
     - `autonomous_tasks`: Persistent active task state memory.
     - `execution_logs`: Structured step-by-step logs (`Goal → Decision → Observation → Action → Verification`).
   - **Jetpack DataStore Preferences**: Type-safe settings persistence across restarts.

## 🛠 Build & Installation

1. Open Android Studio and open `/android`.
2. Sync Gradle files.
3. Build the APK:
   ```bash
   ./gradlew assembleDebug
   ```
4. Output APK location:
   `app/build/outputs/apk/debug/app-debug.apk`
