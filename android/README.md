# BongoLive AI - Native Android Application

BongoLive AI (MYRA) is a zero-latency real-time Bengali conversational voice & autonomous screen assistant, built as a 100% native Android application using Kotlin and Jetpack Compose.

## 🛠 Native Android Architecture

- **UI Layer**: Jetpack Compose, Material 3, Navigation Compose, Custom Canvas-animated Voice Orb.
- **Architecture Pattern**: MVVM with Clean Architecture (`UI → ViewModel → Repository → DAO/Remote`).
- **Local Persistence**: 
  - **Room Database**: Persistent chat messages and autonomous task snapshots.
  - **DataStore Preferences**: Settings, Gemini API key, selected voice model, and accessibility options.
- **Real-Time Voice & Audio Engine**:
  - **Native AudioRecord**: Streams 16 kHz 16-bit PCM mono microphone audio.
  - **Native AudioTrack**: High-fidelity 24 kHz PCM speech output with immediate flush on user speech interruption.
  - **Foreground Service**: `LiveVoiceForegroundService` for continuous zero-latency background microphone and audio playback.
- **Autonomous & Accessibility Engine**:
  - `MyraAccessibilityService`: Interacts with Android OS gestures (`dispatchGesture` for scrolling, tapping, typing, launching apps).
- **Network & AI Layer**:
  - Retrofit & OkHttp with bidirectional WebSocket streaming to Gemini Live API (`gemini-3.8-live`).
  - Google Search & Maps Grounding support.

## 🚀 How to Build & Run in Android Studio

1. Open **Android Studio** (Koala / Ladybug or newer with JDK 17/21).
2. Select **Open** and select the `/android` folder.
3. Allow Gradle to sync.
4. Connect an Android device (Android 8.0+ / API 26+) or launch an Android Virtual Device (AVD).
5. Click **Run 'app'** or execute:
   ```bash
   ./gradlew assembleDebug
   ```
6. The debug APK will be generated at:
   `app/build/outputs/apk/debug/app-debug.apk`
