/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TabType,
  AppSettings,
  ChatMessage,
  LiveCaption,
  NewsItem,
  YouTubeVideoItem,
  DeviceActionType,
  GroundingFilterMode,
} from './types';
import { LiveClient, LiveConnectionStatus } from './services/liveClient';
import { NewsService } from './services/newsService';
import { YouTubeService } from './services/youtubeService';
import { BottomNav } from './components/BottomNav';
import { HomeMenu } from './components/HomeMenu';
import { ChatView } from './components/ChatView';
import { SettingsView } from './components/SettingsView';
import { LiveVoiceOrb } from './components/LiveVoiceOrb';
import { ScreenSharePreview } from './components/ScreenSharePreview';
import { AccessibilityModal } from './components/AccessibilityModal';
import { FloatingNewsCard } from './components/FloatingNewsCard';
import { YouTubePlayerModal } from './components/YouTubePlayerModal';
import { AndroidEmulatorOverlay } from './components/AndroidEmulatorOverlay';

// MYRA Universal Autonomous AI Agent Engine
import { MyraAutonomousCore } from './services/autonomous/myraAutonomousCore';
import { ConversationIntentRouter } from './services/autonomous/conversationIntentRouter';
import { PersistedTaskSnapshot } from './services/autonomous/types';
import { AutonomousTaskCard } from './components/autonomous/AutonomousTaskCard';
import { ResumableTaskBanner } from './components/autonomous/ResumableTaskBanner';
import { TaskTimelineModal } from './components/autonomous/TaskTimelineModal';
import { AccessibilityController } from './services/autonomous/accessibilityController';

// MYRA Universal Communication Extension
import { UniversalCommunicationController } from './services/autonomous/communication/universalCommunicationController';
import {
  IncomingCallState,
  ActiveCallState,
} from './services/autonomous/communication/types';
import { IncomingCallBanner } from './components/communication/IncomingCallBanner';
import { ActiveCallModal } from './components/communication/ActiveCallModal';

const SETTINGS_STORAGE_KEY = 'bongolive_settings_v2';
const CHAT_STORAGE_KEY = 'bongolive_messages_v2';

const DEFAULT_SETTINGS: AppSettings = {
  customApiKey: '',
  useCustomApiKey: false,
  youtubeApiKey: '',
  useCustomYoutubeApiKey: false,
  liveModel: 'gemini-3.8-live',
  chatModel: 'gemini-3.5-flash',
  voice: 'Kore',
  systemInstruction: `আপনি 'MYRA (মায়রা)' - একজন ইউনিভার্সাল অটোনোমাস এআই সহকারী (Autonomous AI Agent)।
আপনার ক্ষমতা:
১. ব্যবহারকারীর সাথে সাবলীল, সুন্দর বাংলায় কথা বলা ও প্রশ্নের উত্তর দেওয়া।
২. WhatsApp, Messenger, Telegram, Signal-এ স্বয়ংক্রিয়ভাবে মেসেজ পাঠানো এবং অডিও/ভিডিও কল পরিচালনা করা।
৩. ইনকামিং কল এলে ব্যবহারকারীকে জানানো এবং "ধরো" বা "কেটে দাও" নির্দেশ অনুযায়ী সাথে সাথে পদক্ষেপ নেওয়া।
৪. স্ক্রিন দেখে স্বয়ংক্রিয়ভাবে জটিল টাস্ক সম্পন্ন করা (যেমন: Chrome খুলে Google-এ গিয়ে YouTube সার্চ করা, যেকোনো অ্যাপ পরিচালনা করা)।
৫. কাজের প্রতিটি ধাপে পর্যবেক্ষণ ও ফলাফল যাচাই করা।
৬. ডিভাইস কন্ট্রোল ও অ্যাকশন:
   - [ACTION:launch_app:AppName]
   - [ACTION:play_youtube:Query]
   - [ACTION:get_news]
   - [ACTION:scroll_down]
   - [ACTION:scroll_up]
   - [ACTION:toggle_flashlight]`,
  enableLiveCaptions: true,
  enableBackgroundMode: true,
  enableWakeLock: true,
  accessibilityServiceEnabled: true,
  floatingOverlayEnabled: true,
  locationPermissionEnabled: true,
  notificationsPermissionEnabled: true,
  contactsPermissionEnabled: true,
  cameraPermissionEnabled: true,
  phoneStatePermissionEnabled: true,
  batteryOptimizationIgnored: true,
  speechRate: 1.0,
  highContrast: false,
  fontSize: 'normal',
  bengaliDialect: 'standard',
  defaultGroundingMode: 'auto',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [liveStatus, setLiveStatus] = useState<LiveConnectionStatus>('idle');
  const [isVoiceOrbOpen, setIsVoiceOrbOpen] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [liveCaptions, setLiveCaptions] = useState<LiveCaption[]>([]);
  const [interimCaption, setInterimCaption] = useState<string>('');
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [proactivePermissionPrompt, setProactivePermissionPrompt] =
    useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autonomous Task states
  const [activeTaskSnapshot, setActiveTaskSnapshot] =
    useState<PersistedTaskSnapshot | null>(null);
  const [isTaskTimelineOpen, setIsTaskTimelineOpen] = useState(false);
  const [isResumableBannerDismissed, setIsResumableBannerDismissed] =
    useState(false);

  // Universal Communication states
  const [incomingCallState, setIncomingCallState] =
    useState<IncomingCallState | null>(null);
  const [activeCallState, setActiveCallState] = useState<ActiveCallState | null>(
    null
  );

  // Floating News Card states
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  // YouTube states
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideoItem | null>(null);
  const [youTubePlaylist, setYouTubePlaylist] = useState<YouTubeVideoItem[]>([]);

  // Device Gesture / Action states
  const [activeGesture, setActiveGesture] = useState<{
    type: DeviceActionType;
    text?: string;
  } | null>(null);

  const liveClientRef = useRef<LiveClient | null>(null);
  const wakeLockRef = useRef<any>(null);
  const lastActionDispatchRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  // Autonomous Core & Communication Controller references
  const autonomousCore = useRef<MyraAutonomousCore>(
    MyraAutonomousCore.getInstance()
  );
  const commController = useRef<UniversalCommunicationController>(
    UniversalCommunicationController.getInstance()
  );

  // Subscribe to Autonomous Core Task updates & Narration
  useEffect(() => {
    const core = autonomousCore.current;

    const unsubTask = core.subscribeTaskUpdate((snapshot) => {
      setActiveTaskSnapshot({ ...snapshot });
    });

    const unsubNarration = core.subscribeNarration((narration) => {
      const now = Date.now();
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && now - last.timestamp < 3500) {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content: `${last.content}\n${narration}`,
              timestamp: now,
            },
          ];
        }
        return [
          ...prev,
          {
            id: `narr_${now}`,
            role: 'assistant',
            content: narration,
            timestamp: now,
          },
        ];
      });

      if (liveClientRef.current && liveStatus === 'connected') {
        liveClientRef.current.sendTextMessage(narration);
      }
    });

    // Wire physical action events to emulator gesture overlay
    AccessibilityController.setOnActionExecuted((action, detail) => {
      if (action === 'open_app') {
        triggerGesture('launch_app', detail);
      } else if (action === 'scroll_down') {
        triggerGesture('scroll_down');
      } else if (action === 'scroll_up') {
        triggerGesture('scroll_up');
      } else if (action === 'click') {
        triggerGesture('launch_app', `Clicked: ${detail}`);
      }
    });

    return () => {
      unsubTask();
      unsubNarration();
    };
  }, [liveStatus]);

  // Subscribe to Communication Incoming Calls & Active Calls
  useEffect(() => {
    const comm = commController.current;

    const unsubIncoming = comm.subscribeIncomingCall((call) => {
      setIncomingCallState(call ? { ...call } : null);
      if (call && call.detected) {
        // Natural Voice Assistant Prompt for Incoming Call
        const prompt = `${
          call.app === 'whatsapp'
            ? 'WhatsApp'
            : call.app === 'messenger'
            ? 'Messenger'
            : call.app === 'telegram'
            ? 'Telegram'
            : call.app === 'signal'
            ? 'Signal'
            : 'Phone'
        }-এ ${call.contactName}-এর ${
          call.callType === 'VIDEO' ? 'ভিডিও' : 'অডিও'
        } কল এসেছে। ধরব?`;

        setMessages((prev) => [
          ...prev,
          {
            id: `call_${Date.now()}`,
            role: 'assistant',
            content: prompt,
            timestamp: Date.now(),
          },
        ]);

        if (liveClientRef.current && liveStatus === 'connected') {
          liveClientRef.current.sendTextMessage(prompt);
        }
      }
    });

    const unsubActive = comm.subscribeActiveCall((active) => {
      setActiveCallState(active ? { ...active } : null);
    });

    return () => {
      unsubIncoming();
      unsubActive();
    };
  }, [liveStatus]);

  // Proactively verify critical permissions upon app initialization and runtime changes
  useEffect(() => {
    let isMounted = true;

    const verifyRequiredPermissions = async () => {
      const missingPermissions: string[] = [];

      // 1. Check Android Accessibility Service
      if (!settings.accessibilityServiceEnabled) {
        missingPermissions.push('অ্যাক্সেসিবিলিটি সার্ভিস (Accessibility Service)');
      }

      // 2. Check Floating Overlay Permission
      if (!settings.floatingOverlayEnabled) {
        missingPermissions.push('ফ্লোটিং ওভারলে পারমিশন (SYSTEM_ALERT_WINDOW)');
      }

      // 3. Check Microphone Permission
      let micState: PermissionState | 'unknown' = 'unknown';
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const micQuery = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });
          micState = micQuery.state;
          if (micState === 'denied' || micState === 'prompt') {
            missingPermissions.push('মাইক্রোফোন এক্সেস (RECORD_AUDIO)');
          }

          // Listen for runtime permission revocation by user
          micQuery.onchange = () => {
            if (!isMounted) return;
            if (micQuery.state === 'denied' || micQuery.state === 'prompt') {
              setProactivePermissionPrompt(
                'সতর্কবার্তা: মাইক্রোফোনের অনুমতি বন্ধ বা বাতিল করা হয়েছে। লাইভ ভয়েস সহকারীর জন্য পুনরায় মাইক্রোফোন সক্রিয় করুন।'
              );
              setIsAccessibilityOpen(true);
            }
          };
        } catch (e) {}
      }

      if (!isMounted) return;

      // If any critical required permissions are missing or revoked, proactively show prompt
      if (missingPermissions.length > 0) {
        const promptText = `অ্যাপের স্বয়ংক্রিয় সেবা ও ভয়েস অ্যাসিস্ট্যান্ট পূর্ণাঙ্গভাবে সচল রাখতে নিম্নোক্ত পারমিশনগুলো আবশ্যক:\n• ${missingPermissions.join(
          '\n• '
        )}`;
        setProactivePermissionPrompt(promptText);

        // Open modal if essential accessibility or overlay service is disabled
        if (!settings.accessibilityServiceEnabled || !settings.floatingOverlayEnabled) {
          setIsAccessibilityOpen(true);
        }
      } else {
        setProactivePermissionPrompt(null);
      }
    };

    verifyRequiredPermissions();

    return () => {
      isMounted = false;
    };
  }, [settings.accessibilityServiceEnabled, settings.floatingOverlayEnabled]);

  // Save settings on change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
    if (liveClientRef.current) {
      liveClientRef.current.updateSettings(settings);
    }
  }, [settings]);

  // Save messages on change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Manage WakeLock for conversation
  useEffect(() => {
    const manageWakeLock = async () => {
      if (
        settings.enableWakeLock &&
        (isVoiceOrbOpen || isScreenSharing || isNewsOpen || activeCallState)
      ) {
        if ('wakeLock' in navigator && !wakeLockRef.current) {
          try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          } catch (e) {}
        }
      } else if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch (e) {}
        wakeLockRef.current = null;
      }
    };
    manageWakeLock();
  }, [
    isVoiceOrbOpen,
    isScreenSharing,
    isNewsOpen,
    activeCallState,
    settings.enableWakeLock,
  ]);

  // Gesture trigger helper
  const triggerGesture = (type: DeviceActionType, text?: string) => {
    setActiveGesture({ type, text });
    setTimeout(() => {
      setActiveGesture(null);
    }, 2800);
  };

  // Open 5 Latest News
  const handleOpenNews = useCallback(async () => {
    try {
      const items = await NewsService.getLatest5News();
      setNewsList(items);
      setIsNewsOpen(true);
    } catch (e) {
      console.warn('Failed to load news:', e);
      const fallback = NewsService.getFallbackNews();
      setNewsList(fallback);
      setIsNewsOpen(true);
    }
  }, []);

  // Assistant reads news aloud through its own Gemini voice
  const handleAskAssistantToReadNews = useCallback((newsText: string) => {
    if (liveClientRef.current && liveStatus === 'connected') {
      liveClientRef.current.sendTextMessage(
        `এই সংবাদটি সুন্দর ও স্পষ্ট বাংলায় পড়ে শোনাও: ${newsText}`
      );
    }
  }, [liveStatus]);

  // Open YouTube Video / Player
  const handleOpenYouTube = useCallback(
    async (query: string = 'সেরা বাংলা গান') => {
      try {
        const videos = await YouTubeService.searchVideos(
          query,
          settings.useCustomYoutubeApiKey ? settings.youtubeApiKey : undefined
        );
        if (videos.length > 0) {
          setActiveVideo(videos[0]);
          setYouTubePlaylist(videos);
          setIsYouTubeOpen(true);
          triggerGesture('launch_app', `YouTube: ${videos[0].title}`);
        }
      } catch (e) {
        console.warn('YouTube search error:', e);
      }
    },
    [settings.useCustomYoutubeApiKey, settings.youtubeApiKey]
  );

  // Logical single-dispatch action handler
  const dispatchActionOnce = useCallback(
    (actionName: string, actionParam?: string) => {
      const key = `${actionName}_${actionParam || ''}`;
      const now = Date.now();
      if (lastActionDispatchRef.current.key === key && now - lastActionDispatchRef.current.time < 4000) {
        return;
      }
      lastActionDispatchRef.current = { key, time: now };

      if (actionName === 'get_news') {
        handleOpenNews();
      } else if (actionName === 'play_youtube') {
        handleOpenYouTube(actionParam || 'সেরা বাংলা গান');
      } else if (actionName === 'scroll_down') {
        triggerGesture('scroll_down');
      } else if (actionName === 'scroll_up') {
        triggerGesture('scroll_up');
      } else if (actionName === 'launch_app') {
        triggerGesture('launch_app', actionParam);
      } else if (actionName === 'toggle_flashlight') {
        triggerGesture('toggle_flashlight');
      }
    },
    [handleOpenNews, handleOpenYouTube]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setLiveCaptions([]);
    setInterimCaption('');
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {}
  }, []);

  // Initialize Live Client
  useEffect(() => {
    const client = new LiveClient(settings);
    liveClientRef.current = client;

    client.onStatusChange = (status) => {
      setLiveStatus(status);
      if (status === 'connected') {
        setIsVoiceOrbOpen(true);
      }
    };

    client.onAssistantSpeakingChange = (speaking) => {
      setIsAssistantSpeaking(speaking);
    };

    // Native Gemini Live Function / Tool Calling
    client.onToolCall = (call) => {
      const { callId, name, args } = call;
      let result = 'success';

      if (name === 'play_youtube') {
        dispatchActionOnce('play_youtube', args?.query || 'সেরা বাংলা গান');
        result = `Playing YouTube video: ${args?.query}`;
      } else if (name === 'get_news') {
        dispatchActionOnce('get_news');
        result = 'Top 5 Bengali news opened on screen';
      } else if (name === 'launch_app') {
        dispatchActionOnce('launch_app', args?.appName);
        result = `App launched: ${args?.appName}`;
      } else if (name === 'scroll_screen') {
        dispatchActionOnce(args?.direction === 'up' ? 'scroll_up' : 'scroll_down');
        result = `Screen scrolled ${args?.direction}`;
      } else if (name === 'toggle_flashlight') {
        dispatchActionOnce('toggle_flashlight');
        result = 'Flashlight toggled';
      }

      client.sendToolResponse(callId, result);
    };

    // Streaming Turn Accumulator
    client.onCaption = (caption) => {
      setLiveCaptions((prev) => [...prev.slice(-20), caption]);
      if (caption.speaker === 'user') {
        setInterimCaption('');
      }

      const rawText = caption.text?.trim() || '';
      if (!rawText) return;

      const speaker = caption.speaker === 'user' ? 'user' : 'assistant';

      // Check intent if user is speaking
      if (speaker === 'user') {
        const classified = ConversationIntentRouter.classify(
          rawText,
          autonomousCore.current.hasActiveOrResumableTask()
        );

        if (classified.isFastDeterministic && classified.controlAction) {
          if (classified.controlAction === 'ACCEPT_CALL') {
            commController.current.acceptPendingCall();
          } else if (classified.controlAction === 'REJECT_CALL') {
            commController.current.rejectPendingCall();
          } else if (classified.controlAction === 'END_CALL') {
            commController.current.endCall();
          } else if (classified.controlAction === 'MUTE_CALL') {
            commController.current.toggleMute();
          } else if (classified.controlAction === 'SPEAKER_CALL') {
            commController.current.toggleSpeaker();
          } else if (classified.controlAction === 'PAUSE') {
            autonomousCore.current.pause();
          } else if (
            classified.controlAction === 'RESUME' ||
            classified.controlAction === 'CONTINUE_PREVIOUS'
          ) {
            autonomousCore.current.resume();
          } else if (classified.controlAction === 'STOP') {
            autonomousCore.current.stop();
          }
        }
      }

      // Check for action tag in caption text
      let actionFound: { name: string; param?: string } | null = null;
      const match = rawText.match(/\[ACTION:([a-zA-Z_]+)(?::([^\]]+))?\]/);
      if (match) {
        actionFound = {
          name: match[1],
          param: match[2]?.trim(),
        };
      }

      const cleanText = rawText.replace(/\[ACTION:[^\]]+\]/g, '').trim();

      if (actionFound) {
        dispatchActionOnce(actionFound.name, actionFound.param);
      }

      if (!cleanText) return;

      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        const lastMsg = prev[lastIdx];
        const now = Date.now();

        if (lastMsg && lastMsg.role === speaker && now - lastMsg.timestamp < 4500) {
          if (lastMsg.content.includes(cleanText)) {
            return prev;
          }
          const mergedText = `${lastMsg.content} ${cleanText}`.trim();
          const updated: ChatMessage = {
            ...lastMsg,
            content: mergedText,
            timestamp: now,
            toolCall: actionFound
              ? { name: actionFound.name, params: { query: actionFound.param } }
              : lastMsg.toolCall,
          };
          const next = [...prev];
          next[lastIdx] = updated;
          return next;
        }

        const newMsg: ChatMessage = {
          id: `${now}-${Math.random().toString(36).substring(2, 6)}`,
          role: speaker,
          content: cleanText,
          timestamp: now,
          toolCall: actionFound
            ? { name: actionFound.name, params: { query: actionFound.param } }
            : undefined,
        };
        return [...prev, newMsg];
      });
    };

    client.onInterimCaption = (text) => {
      setInterimCaption(text);
    };

    client.onScreenShareChange = (sharing, stream) => {
      setIsScreenSharing(sharing);
      setScreenStream(stream);
    };

    client.onError = (err) => {
      setErrorMessage(err);
      setTimeout(() => setErrorMessage(null), 5000);
    };

    return () => {
      client.destroy();
      liveClientRef.current = null;
    };
  }, [dispatchActionOnce, settings]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleStartLiveVoice = useCallback(async () => {
    if (!liveClientRef.current) return;
    setIsVoiceOrbOpen(true);
    setCurrentTab('chat');
    if (liveStatus !== 'connected') {
      await liveClientRef.current.connect();
    }
  }, [liveStatus]);

  const handleDisconnectLive = useCallback(() => {
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
    }
    setIsVoiceOrbOpen(false);
    setIsAssistantSpeaking(false);
    setInterimCaption('');
  }, []);

  const handleToggleScreenShare = useCallback(async () => {
    if (!liveClientRef.current) return;
    if (isScreenSharing) {
      liveClientRef.current.stopScreenShare();
    } else {
      if (liveStatus !== 'connected') {
        await liveClientRef.current.connect();
      }
      await liveClientRef.current.startScreenShare();
    }
  }, [isScreenSharing, liveStatus]);

  const handleInterrupt = useCallback(() => {
    if (liveClientRef.current) {
      liveClientRef.current.interrupt();
    }
    autonomousCore.current.pause();
    setIsAssistantSpeaking(false);
  }, []);

  // Send message from chat input box with Universal Autonomous Agent & Communication routing
  const handleSendMessage = async (
    text: string,
    imageBase64?: string,
    groundingMode: GroundingFilterMode = 'auto'
  ) => {
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      imageThumbnail: imageBase64,
    };

    setMessages((prev) => [...prev, userMsg]);

    // 1. Classify User Intent
    const hasActiveTask = autonomousCore.current.hasActiveOrResumableTask();
    const classified = ConversationIntentRouter.classify(text, hasActiveTask);

    // 2. Handle Fast-Path Call Controls (Accept, Reject, Mute, Speaker, End)
    if (classified.controlAction === 'ACCEPT_CALL') {
      await commController.current.acceptPendingCall();
      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'ঠিক আছে, আমি কলটি রিসিভ করেছি।',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (classified.controlAction === 'REJECT_CALL') {
      await commController.current.rejectPendingCall();
      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'কলটি কেটে দেওয়া হয়েছে।',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (classified.controlAction === 'END_CALL') {
      await commController.current.endCall();
      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'কল সমাপ্ত করা হয়েছে।',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (classified.controlAction === 'MUTE_CALL') {
      await commController.current.toggleMute();
      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'কল মিউট/আনমিউট করা হয়েছে।',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (classified.controlAction === 'SPEAKER_CALL') {
      await commController.current.toggleSpeaker();
      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'স্পিকার পরিবর্তন করা হয়েছে।',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // 3. Handle Immediate Task Controls (Pause, Resume, Stop, Status, Timeline)
    if (classified.intent === 'CONTROL_COMMAND' && classified.controlAction) {
      let botResponse = '';
      if (classified.controlAction === 'PAUSE') {
        autonomousCore.current.pause();
        botResponse = 'ঠিক আছে, আমি কাজ সাময়িকভাবে স্থগিত (Pause) করেছি।';
      } else if (classified.controlAction === 'RESUME') {
        autonomousCore.current.resume();
        botResponse = 'বর্তমান স্ক্রিন যাচাই করে কাজ পুনরায় শুরু করছি।';
      } else if (classified.controlAction === 'CONTINUE_PREVIOUS') {
        autonomousCore.current.reconcileAndResume();
        botResponse = 'পূর্বের কাজের অবস্থা যাচাই করে এগিয়ে যাচ্ছি।';
      } else if (classified.controlAction === 'WHAT_ARE_YOU_DOING') {
        botResponse = autonomousCore.current.getWhatAreYouDoingExplanation();
      } else if (classified.controlAction === 'WHAT_HAVE_YOU_DONE') {
        botResponse = autonomousCore.current.getWhatHaveYouDoneExplanation();
      }

      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: botResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (classified.intent === 'TASK_CANCEL') {
      autonomousCore.current.stop();
      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'কাজটি বাতিল ও বন্ধ করা হয়েছে।',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (classified.intent === 'TASK_CORRECTION' && classified.correctionDetail) {
      autonomousCore.current.handleUserCorrection(classified.correctionDetail);
      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'আপনার নতুন নির্দেশনা অনুযায়ী টাস্ক আপডেট করা হয়েছে।',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // 4. Autonomous Automation & Communication Task Initiation
    if (classified.intent === 'AUTOMATION_REQUEST' && classified.extractedGoal) {
      autonomousCore.current.startTask(classified.extractedGoal);
      return;
    }

    // 5. Live session text bridge if live connected
    if (liveStatus === 'connected' && liveClientRef.current && !imageBase64) {
      liveClientRef.current.sendTextMessage(text);
      return;
    }

    // 6. Normal Conversation & Google Search / Maps Grounding
    let userLocation: { latitude: number; longitude: number } | undefined;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos: any = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
            timeout: 1500,
            maximumAge: 60000,
          });
        });
        if (pos?.coords) {
          userLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        }
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          history: messages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: 'gemini-3.5-flash',
          customApiKey: settings.useCustomApiKey ? settings.customApiKey : undefined,
          imageBase64,
          systemInstruction: settings.systemInstruction,
          groundingMode,
          userLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'উত্তর পাওয়া যায়নি।');
      }

      if (data.action) {
        dispatchActionOnce(data.action.name, data.action.param);
      }

      const botMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.text || 'কোনো প্রতিক্রিয়া পাওয়া যায়নি।',
        timestamp: Date.now(),
        toolCall: data.action ? { name: data.action.name, params: { query: data.action.param } } : undefined,
        groundingMetadata: data.groundingMetadata,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: `⚠️ ত্রুটি: ${err.message || 'নেটওয়ার্ক সংযোগে সমস্যা হয়েছে।'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 antialiased ${
        settings.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* Global Error Banner */}
      {errorMessage && (
        <div className="fixed top-2 left-4 right-4 z-50 p-3 rounded-2xl bg-red-600/90 text-white text-xs font-medium shadow-2xl backdrop-blur-md flex items-center justify-between border-[1.5px] border-red-400 max-w-lg mx-auto animate-bounce">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 font-bold px-2 py-0.5 rounded-lg bg-black/30 hover:bg-black/50"
          >
            ×
          </button>
        </div>
      )}

      {/* Main View by Tab */}
      <main className="w-full">
        {currentTab === 'home' && (
          <HomeMenu
            onSelectTab={setCurrentTab}
            onStartLiveVoice={handleStartLiveVoice}
            onStartScreenShare={handleToggleScreenShare}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
            onSendPresetPrompt={(prompt) => handleSendMessage(prompt)}
            onOpenNews={handleOpenNews}
            onOpenYouTube={handleOpenYouTube}
            settings={settings}
            isLiveActive={liveStatus === 'connected'}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            onStartLiveVoice={handleStartLiveVoice}
            onToggleScreenShare={handleToggleScreenShare}
            onOpenNews={handleOpenNews}
            onOpenYouTube={handleOpenYouTube}
            isLiveActive={liveStatus === 'connected'}
            isScreenSharing={isScreenSharing}
            isAssistantSpeaking={isAssistantSpeaking}
            onInterrupt={handleInterrupt}
            onClearChat={handleClearChat}
            settings={settings}
            liveCaptions={liveCaptions}
            interimCaption={interimCaption}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
          />
        )}
      </main>

      {/* Incoming Call Alert Banner (WhatsApp / Messenger / Telegram / Signal) */}
      <IncomingCallBanner
        incomingCall={incomingCallState}
        onAccept={() => commController.current.acceptPendingCall()}
        onReject={() => commController.current.rejectPendingCall()}
      />

      {/* Ongoing Active Call Modal (Mute, Speaker, End) */}
      <ActiveCallModal
        activeCall={activeCallState}
        onToggleMute={() => commController.current.toggleMute()}
        onToggleSpeaker={() => commController.current.toggleSpeaker()}
        onEndCall={() => commController.current.endCall()}
      />

      {/* Autonomous Active Task Card */}
      <AutonomousTaskCard
        snapshot={activeTaskSnapshot}
        onPause={() => autonomousCore.current.pause()}
        onResume={() => autonomousCore.current.resume()}
        onStop={() => autonomousCore.current.stop()}
        onOpenTimeline={() => setIsTaskTimelineOpen(true)}
      />

      {/* Resumable Previous Task Banner (Shown when returning to app) */}
      {!isResumableBannerDismissed &&
        activeTaskSnapshot?.currentState === 'READY_TO_RESUME' && (
          <ResumableTaskBanner
            snapshot={activeTaskSnapshot}
            onResume={() => autonomousCore.current.reconcileAndResume()}
            onRestart={() =>
              autonomousCore.current.startTask(activeTaskSnapshot.originalGoal)
            }
            onDismiss={() => setIsResumableBannerDismissed(true)}
          />
        )}

      {/* Task Event Timeline Modal */}
      <TaskTimelineModal
        isOpen={isTaskTimelineOpen}
        snapshot={activeTaskSnapshot}
        onClose={() => setIsTaskTimelineOpen(false)}
      />

      {/* Screen Share PiP Floating Preview */}
      <ScreenSharePreview
        stream={screenStream}
        onStop={handleToggleScreenShare}
      />

      {/* Floating 5 Latest News Card */}
      <FloatingNewsCard
        isOpen={isNewsOpen}
        newsList={newsList}
        onClose={() => setIsNewsOpen(false)}
        onAskAssistantToRead={handleAskAssistantToReadNews}
        isAssistantSpeaking={isAssistantSpeaking}
      />

      {/* Docked, Non-blinking YouTube Video/Song Player */}
      <YouTubePlayerModal
        isOpen={isYouTubeOpen}
        video={activeVideo}
        playlist={youTubePlaylist}
        onSelectVideo={(v) => setActiveVideo(v)}
        onClose={() => setIsYouTubeOpen(false)}
      />

      {/* Android Accessibility & Device Controller Overlay */}
      {settings.floatingOverlayEnabled && (
        <AndroidEmulatorOverlay
          onExecuteAction={(act, p) => triggerGesture(act, p)}
          onOpenNews={handleOpenNews}
          onOpenYouTube={handleOpenYouTube}
          activeGesture={activeGesture}
          accessibilityEnabled={settings.accessibilityServiceEnabled}
          onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        />
      )}

      {/* Gemini Live Dynamic Voice Orb */}
      <LiveVoiceOrb
        isOpen={isVoiceOrbOpen}
        status={liveStatus}
        isAssistantSpeaking={isAssistantSpeaking}
        isScreenSharing={isScreenSharing}
        activeCaptions={liveCaptions}
        interimCaption={interimCaption}
        onInterrupt={handleInterrupt}
        onToggleScreenShare={handleToggleScreenShare}
        onDisconnect={handleDisconnectLive}
        onClose={() => setIsVoiceOrbOpen(false)}
        getAudioFrequency={() =>
          liveClientRef.current?.getAudioFrequencyData() || new Uint8Array(0)
        }
        getMicFrequency={() =>
          liveClientRef.current?.getMicFrequencyData() || new Uint8Array(0)
        }
        voiceName={settings.voice}
        modelName={settings.liveModel}
      />

      {/* Accessibility & Permissions Dashboard Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        proactivePromptMessage={proactivePermissionPrompt}
      />

      {/* Bottom Navigation Dock */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isLiveActive={liveStatus === 'connected'}
      />
    </div>
  );
}
