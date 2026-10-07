# BongoLive AI - Native Android Real-time Bengali Voice & Autonomous Screen Assistant

BongoLive AI (MYRA) is a complete native Android application written in **Kotlin** and **Jetpack Compose** (Material Design 3). It features real-time full-duplex conversational voice interaction via the Gemini Live API, autonomous screen inspection and accessibility automation, real-time diagnostics and self-troubleshooting, floating overlay control, and persistent local storage with Room and DataStore.

## Key Features

- **Full-Duplex Gemini Live Voice Conversation**: Real-time 16 kHz PCM microphone capture (`AudioRecord`), instant WebSocket bi-directional streaming, 24 kHz playback (`AudioTrack`), speech interruption detection, and live dual-speaker captions.
- **Autonomous Task Engine & Automation**: `MyraAccessibilityService` with node hierarchy inspection, automated gesture dispatching, app launching, scrolling, typing, and goal-directed task loops.
- **Screen Vision & MediaProjection**: Background `ScreenCaptureService` with `VirtualDisplay` and `ImageReader` for real-time visual reasoning and step verification.
- **Diagnostics & Self-Troubleshooting**: In-depth diagnostics for CPU, Memory, Network, Battery, Thermal, Storage, Audio, Accessibility, Gemini Live connectivity, and Anti-Loop protection.
- **Floating Assistant Overlay**: Draggable system overlay window for quick voice access from any app.
- **Local Persistence (Room + DataStore)**: Full offline-first storage for chats, task snapshots, execution logs, diagnostics records, and app preferences.
