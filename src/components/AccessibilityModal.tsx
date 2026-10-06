/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mic,
  Monitor,
  Volume2,
  Moon,
  Type,
  CheckCircle2,
  AlertCircle,
  X,
  Gauge,
  Sliders,
  Smartphone,
  Layers,
  Sparkles,
  MapPin,
  Bell,
  Users,
  Camera,
  BatteryCharging,
  PhoneCall,
} from 'lucide-react';
import { AppSettings, PermissionStatusState } from '../types';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  proactivePromptMessage?: string | null;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  proactivePromptMessage,
}) => {
  const [permissions, setPermissions] = useState<PermissionStatusState>({
    microphone: 'unknown',
    screenShare: 'supported',
    audioPlayback: 'active',
    wakeLock: 'supported',
    accessibilityService: settings.accessibilityServiceEnabled
      ? 'granted'
      : 'denied',
    floatingOverlay: settings.floatingOverlayEnabled ? 'granted' : 'denied',
    location: settings.locationPermissionEnabled ? 'granted' : 'prompt',
    notifications: settings.notificationsPermissionEnabled
      ? 'granted'
      : 'prompt',
    contacts: settings.contactsPermissionEnabled ? 'granted' : 'denied',
    camera: settings.cameraPermissionEnabled ? 'granted' : 'prompt',
    phoneState: settings.phoneStatePermissionEnabled ? 'granted' : 'denied',
    batteryOptimization: settings.batteryOptimizationIgnored
      ? 'ignored'
      : 'restricted',
  });

  const [micTestActive, setMicTestActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Check mic permission
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((res) => {
          setPermissions((prev) => ({
            ...prev,
            microphone: res.state as any,
          }));
          res.onchange = () => {
            setPermissions((prev) => ({
              ...prev,
              microphone: res.state as any,
            }));
          };
        })
        .catch(() => {
          setPermissions((prev) => ({ ...prev, microphone: 'prompt' }));
        });

      // Check geolocation permission
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          setPermissions((prev) => ({
            ...prev,
            location: res.state as any,
          }));
        })
        .catch(() => {});

      // Check notification permission if available
      if ('Notification' in window) {
        setPermissions((prev) => ({
          ...prev,
          notifications:
            Notification.permission === 'granted'
              ? 'granted'
              : Notification.permission === 'denied'
              ? 'denied'
              : 'prompt',
        }));
      }
    }

    // Check screen share support
    const hasDisplayMedia = Boolean(
      navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
    );

    setPermissions((prev) => ({
      ...prev,
      screenShare: hasDisplayMedia ? 'supported' : 'unsupported',
      wakeLock: 'wakeLock' in navigator ? 'supported' : 'unsupported',
      accessibilityService: settings.accessibilityServiceEnabled
        ? 'granted'
        : 'denied',
      floatingOverlay: settings.floatingOverlayEnabled ? 'granted' : 'denied',
      contacts: settings.contactsPermissionEnabled ? 'granted' : 'denied',
      phoneState: settings.phoneStatePermissionEnabled ? 'granted' : 'denied',
      batteryOptimization: settings.batteryOptimizationIgnored
        ? 'ignored'
        : 'restricted',
    }));
  }, [isOpen, settings]);

  // Mic test
  const testMicrophone = async () => {
    try {
      setMicTestActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissions((prev) => ({ ...prev, microphone: 'granted' }));

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let frames = 0;
      const interval = setInterval(() => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < 20; i++) sum += data[i];
        setMicVolume(Math.min(100, Math.round((sum / 20 / 255) * 100)));
        frames++;
        if (frames > 40) {
          clearInterval(interval);
          stream.getTracks().forEach((t) => t.stop());
          ctx.close();
          setMicTestActive(false);
          setMicVolume(0);
        }
      }, 100);
    } catch (e) {
      setPermissions((prev) => ({ ...prev, microphone: 'denied' }));
      setMicTestActive(false);
    }
  };

  // Request Location
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions((prev) => ({ ...prev, location: 'granted' }));
          onUpdateSettings({ locationPermissionEnabled: true });
        },
        () => {
          setPermissions((prev) => ({ ...prev, location: 'denied' }));
          onUpdateSettings({ locationPermissionEnabled: false });
        }
      );
    }
  };

  // Request Notification
  const requestNotification = async () => {
    if ('Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermissions((prev) => ({
          ...prev,
          notifications: res === 'granted' ? 'granted' : 'denied',
        }));
        onUpdateSettings({ notificationsPermissionEnabled: res === 'granted' });
      } catch (e) {}
    }
  };

  // Request Camera
  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissions((prev) => ({ ...prev, camera: 'granted' }));
      onUpdateSettings({ cameraPermissionEnabled: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      setPermissions((prev) => ({ ...prev, camera: 'denied' }));
      onUpdateSettings({ cameraPermissionEnabled: false });
    }
  };

  const toggleAccessibility = () => {
    const next = !settings.accessibilityServiceEnabled;
    onUpdateSettings({ accessibilityServiceEnabled: next });
    setPermissions((prev) => ({
      ...prev,
      accessibilityService: next ? 'granted' : 'denied',
    }));
  };

  const toggleOverlay = () => {
    const next = !settings.floatingOverlayEnabled;
    onUpdateSettings({ floatingOverlayEnabled: next });
    setPermissions((prev) => ({
      ...prev,
      floatingOverlay: next ? 'granted' : 'denied',
    }));
  };

  const toggleContacts = () => {
    const next = !settings.contactsPermissionEnabled;
    onUpdateSettings({ contactsPermissionEnabled: next });
    setPermissions((prev) => ({
      ...prev,
      contacts: next ? 'granted' : 'denied',
    }));
  };

  const togglePhoneState = () => {
    const next = !settings.phoneStatePermissionEnabled;
    onUpdateSettings({ phoneStatePermissionEnabled: next });
    setPermissions((prev) => ({
      ...prev,
      phoneState: next ? 'granted' : 'denied',
    }));
  };

  const toggleBatteryOptimization = () => {
    const next = !settings.batteryOptimizationIgnored;
    onUpdateSettings({ batteryOptimizationIgnored: next });
    setPermissions((prev) => ({
      ...prev,
      batteryOptimization: next ? 'ignored' : 'restricted',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 rounded-3xl border-[1.5px] border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">
              মোবাইল সিস্টেম ও পারমিশন কন্ট্রোল
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Proactive Permission Missing / Revoked Prompt */}
          {proactivePromptMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border-[1.5px] border-amber-500/40 flex items-start gap-3 animate-fadeIn shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <strong className="text-amber-300 font-bold block">
                  প্রয়োজনীয় পারমিশন অনুমোদন আবশ্যক:
                </strong>
                <p className="text-zinc-300 leading-relaxed">
                  {proactivePromptMessage}
                </p>
              </div>
            </div>
          )}

          {/* Permission Checklist */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              অ্যান্ড্রয়েড ও ডিভাইস পারমিশন স্ট্যাটাস
            </h3>
            <div className="space-y-2">
              {/* 1. Android Accessibility Service */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      অ্যাক্সেসিবিলিটি সার্ভিস (BIND_ACCESSIBILITY_SERVICE)
                    </div>
                    <div className="text-xs text-zinc-400">
                      স্ক্রল, টাইপ ও স্বয়ংক্রিয় অ্যাপ পরিচালনা
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleAccessibility}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.accessibilityService === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.accessibilityService === 'granted'
                    ? 'সক্রিয়'
                    : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 2. Floating Overlay Permission */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      ফ্লোটিং ওভারলে উইন্ডো (SYSTEM_ALERT_WINDOW)
                    </div>
                    <div className="text-xs text-zinc-400">
                      ইনকামিং কল অ্যালার্ট ও ফ্লোটিং কন্ট্রোলার
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleOverlay}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.floatingOverlay === 'granted'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.floatingOverlay === 'granted'
                    ? 'অনুমোদিত'
                    : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 3. Microphone */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      মাইক্রোফোন এক্সেস (RECORD_AUDIO)
                    </div>
                    <div className="text-xs text-zinc-400">
                      লাইভ রিয়েল-টাইম বাংলা ভয়েস ইনপুট
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {permissions.microphone === 'granted' ? (
                    <span className="inline-flex items-center text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> অনুমোদিত
                    </span>
                  ) : (
                    <button
                      onClick={testMicrophone}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/50 hover:bg-emerald-500/30 transition-colors"
                    >
                      {micTestActive ? 'পরীক্ষা হচ্ছে...' : 'অনুমতি দিন'}
                    </button>
                  )}
                </div>
              </div>

              {/* Mic Test Volume Meter */}
              {micTestActive && (
                <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>মাইক্রোফোন সিগন্যাল লেভেল:</span>
                    <span>{micVolume}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-75"
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 4. Fine & Coarse Location Permission */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-amber-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      লাইভ লোকেশন (ACCESS_FINE_LOCATION)
                    </div>
                    <div className="text-xs text-zinc-400">
                      গুগল ম্যাপস গ্রাউন্ডিং ও নিকটস্থ স্থানসমূহ
                    </div>
                  </div>
                </div>
                <button
                  onClick={requestLocation}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.location === 'granted'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.location === 'granted' ? 'সক্রিয়' : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 5. Push Notifications */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-purple-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      পুশ নোটিফিকেশন (POST_NOTIFICATIONS)
                    </div>
                    <div className="text-xs text-zinc-400">
                      ইনকামিং কল ও টাস্ক সমাপ্তির সতর্কবার্তা
                    </div>
                  </div>
                </div>
                <button
                  onClick={requestNotification}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.notifications === 'granted'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.notifications === 'granted'
                    ? 'অনুমোদিত'
                    : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 6. Contacts Access */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-cyan-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      কন্টাক্ট রিড পারমিশন (READ_CONTACTS)
                    </div>
                    <div className="text-xs text-zinc-400">
                      WhatsApp, Messenger ও Telegram কন্টাক্ট শনাক্তকরণ
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleContacts}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.contacts === 'granted'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.contacts === 'granted'
                    ? 'অনুমোদিত'
                    : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 7. Camera Access */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-pink-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      ক্যামেরা এক্সেস (CAMERA)
                    </div>
                    <div className="text-xs text-zinc-400">
                      ভিডিও কল ও লাইভ ক্যামেরা ভিশন
                    </div>
                  </div>
                </div>
                <button
                  onClick={requestCamera}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.camera === 'granted'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.camera === 'granted'
                    ? 'অনুমোদিত'
                    : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 8. Phone State & Call Management */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-indigo-400">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      ফোন ও কল স্টেট (READ_PHONE_STATE & CALL_PHONE)
                    </div>
                    <div className="text-xs text-zinc-400">
                      কল রিসিভ, রিজেক্ট ও হ্যান্ডলিং
                    </div>
                  </div>
                </div>
                <button
                  onClick={togglePhoneState}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.phoneState === 'granted'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.phoneState === 'granted'
                    ? 'সক্রিয়'
                    : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 9. Unrestricted Background & Battery Optimization */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
                    <BatteryCharging className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      আনরেস্ট্রিক্টেড ব্যাকগ্রাউন্ড (IGNORE_BATTERY_OPTIMIZATIONS)
                    </div>
                    <div className="text-xs text-zinc-400">
                      ব্যাকগ্রাউন্ডে এআই সহকারী সচল রাখা
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleBatteryOptimization}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    permissions.batteryOptimization === 'ignored'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {permissions.batteryOptimization === 'ignored'
                    ? 'ছাড় দেওয়া'
                    : 'অনুমতি দিন'}
                </button>
              </div>

              {/* 10. Screen Sharing */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-purple-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      স্ক্রিন ক্যাপচার ও ভিশন (MEDIA_PROJECTION)
                    </div>
                    <div className="text-xs text-zinc-400">
                      রিয়েল-টাইমে স্ক্রিন বিশ্লেষণ ও স্বয়ংক্রিয় ব্রাউজিং
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center text-xs text-purple-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> সাপোর্টেড
                </span>
              </div>

              {/* 11. Audio Playback Engine */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-indigo-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      24kHz স্ট্রিমিং অডিও ইঞ্জিন
                    </div>
                    <div className="text-xs text-zinc-400">
                      স্পিচ সিন্থেসিস ও ইন্টারাপশন হ্যান্ডলার
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> সক্রিয়
                </span>
              </div>
            </div>
          </div>

          {/* Visual & Accessibility Preferences */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              দৃষ্টি ও পঠনযোগ্যতা
            </h3>
            <div className="space-y-3">
              {/* High Contrast */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-amber-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      হাই কনট্রাস্ট মোড
                    </div>
                    <div className="text-xs text-zinc-400">
                      বর্ডার ও লেখার স্পষ্টতা বাড়ায়
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) =>
                    onUpdateSettings({ highContrast: e.target.checked })
                  }
                  className="w-5 h-5 rounded-md accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Font Size Scaling */}
              <div className="p-3 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Type className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-zinc-200">
                      লেখার আকার (Font Size)
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {settings.fontSize === 'normal'
                      ? 'স্বাভাবিক'
                      : settings.fontSize === 'large'
                      ? 'বড়'
                      : 'অতিরিক্ত বড়'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'large', 'extra-large'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => onUpdateSettings({ fontSize: sz })}
                      className={`py-1.5 rounded-xl text-xs font-medium border-[1.5px] transition-all ${
                        settings.fontSize === sz
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                      }`}
                    >
                      {sz === 'normal'
                        ? 'স্বাভাবিক'
                        : sz === 'large'
                        ? 'বড়'
                        : 'অতিরিক্ত বড়'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-sm transition-colors border-[1.5px] border-zinc-700"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
