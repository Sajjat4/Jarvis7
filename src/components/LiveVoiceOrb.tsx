import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  Subtitles,
  Volume2,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  HandMetal,
  StopCircle,
  Eye,
} from 'lucide-react';
import { LiveCaption } from '../types';

interface LiveVoiceOrbProps {
  isOpen: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'interrupted' | 'error' | 'closed';
  isAssistantSpeaking: boolean;
  isScreenSharing: boolean;
  activeCaptions: LiveCaption[];
  interimCaption: string;
  onInterrupt: () => void;
  onToggleScreenShare: () => void;
  onDisconnect: () => void;
  onClose: () => void;
  getAudioFrequency?: () => Uint8Array;
  getMicFrequency?: () => Uint8Array;
  voiceName: string;
  modelName: string;
}

export const LiveVoiceOrb: React.FC<LiveVoiceOrbProps> = ({
  isOpen,
  status,
  isAssistantSpeaking,
  isScreenSharing,
  activeCaptions,
  interimCaption,
  onInterrupt,
  onToggleScreenShare,
  onDisconnect,
  onClose,
  getAudioFrequency,
  getMicFrequency,
  voiceName,
  modelName,
}) => {
  const [showCaptions, setShowCaptions] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [visualScale, setVisualScale] = useState(1);
  const animFrameRef = useRef<number | null>(null);

  // Smooth animation loop reacting to sound frequency
  useEffect(() => {
    if (!isOpen) return;

    const updateVisuals = () => {
      let targetScale = 1;
      if (isAssistantSpeaking && getAudioFrequency) {
        const freq = getAudioFrequency();
        let sum = 0;
        for (let i = 0; i < Math.min(16, freq.length); i++) {
          sum += freq[i];
        }
        const avg = sum / (Math.min(16, freq.length) * 255);
        targetScale = 1 + avg * 0.45;
      } else if (getMicFrequency) {
        const freq = getMicFrequency();
        let sum = 0;
        for (let i = 0; i < Math.min(16, freq.length); i++) {
          sum += freq[i];
        }
        const avg = sum / (Math.min(16, freq.length) * 255);
        targetScale = 1 + avg * 0.25;
      }

      setVisualScale((prev) => prev * 0.75 + targetScale * 0.25);
      animFrameRef.current = requestAnimationFrame(updateVisuals);
    };

    animFrameRef.current = requestAnimationFrame(updateVisuals);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isAssistantSpeaking, getAudioFrequency, getMicFrequency]);

  if (!isOpen) return null;

  const latestAssistantCaption = [...activeCaptions]
    .reverse()
    .find((c) => c.speaker === 'assistant');
  const latestUserCaption = [...activeCaptions]
    .reverse()
    .find((c) => c.speaker === 'user');

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? 'bottom-20 right-4 w-72 rounded-3xl bg-zinc-950/95 border-[1.5px] border-zinc-700/80 shadow-2xl p-4'
          : 'inset-0 bg-zinc-950/95 backdrop-blur-2xl flex flex-col justify-between p-6'
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <span className="flex h-3 w-3 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <div>
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <span>Gemini Live</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {modelName}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              কণ্ঠ: {voiceName} | বাংলা অ্যাসিস্ট্যান্ট
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`p-2 rounded-xl border-[1.5px] transition-colors ${
              showCaptions
                ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
            title="ক্যাপশন দেখান/লুকান"
          >
            <Subtitles className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-[1.5px] border-zinc-800 transition-colors"
            title={isMinimized ? 'বড় করুন' : 'মিনিমাইজ করুন'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Screen Sharing Status Banner */}
      {isScreenSharing && (
        <div className="my-2 py-1.5 px-3 rounded-2xl bg-blue-950/40 border-[1.5px] border-blue-500/50 flex items-center justify-between text-xs text-blue-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span>স্ক্রিন শেয়ারিং সক্রিয় — জিমিনি আপনার স্ক্রিন দেখছে</span>
          </div>
          <button
            onClick={onToggleScreenShare}
            className="px-2 py-0.5 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 text-[11px] text-blue-100 font-medium"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Center Interactive Glowing Voice Orb */}
      <div className="flex-1 flex flex-col items-center justify-center relative py-4">
        {/* Glow rings */}
        <div
          className="absolute rounded-full transition-transform duration-75 pointer-events-none"
          style={{
            width: isMinimized ? '130px' : '280px',
            height: isMinimized ? '130px' : '280px',
            transform: `scale(${visualScale * 1.2})`,
            background: isAssistantSpeaking
              ? 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)',
            filter: 'blur(28px)',
          }}
        />

        {/* Outer Ring */}
        <div
          className="rounded-full flex items-center justify-center p-3 transition-transform duration-100 border-[1.5px] shadow-2xl relative"
          style={{
            width: isMinimized ? '100px' : '220px',
            height: isMinimized ? '100px' : '220px',
            transform: `scale(${visualScale})`,
            borderColor: isAssistantSpeaking ? '#a855f7' : '#10b981',
            backgroundColor: 'rgba(24, 24, 27, 0.85)',
            boxShadow: isAssistantSpeaking
              ? '0 0 50px rgba(168, 85, 247, 0.45)'
              : '0 0 35px rgba(16, 185, 129, 0.3)',
          }}
        >
          {/* Inner Fluid Sphere */}
          <div
            className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
              isAssistantSpeaking
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 animate-pulse'
                : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-400'
            }`}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
            <div className="relative z-10 flex flex-col items-center">
              {isAssistantSpeaking ? (
                <>
                  <Volume2 className="w-8 h-8 text-white animate-bounce mb-1" />
                  <span className="text-[11px] font-semibold text-white/90">
                    বলছি...
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 text-white animate-pulse mb-1" />
                  <span className="text-[11px] font-semibold text-white/90">
                    শুনছি...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* State label & prompt guide */}
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-zinc-200">
            {status === 'connecting'
              ? 'Gemini Live এর সাথে যুক্ত হচ্ছে...'
              : isAssistantSpeaking
              ? 'বাংলায় উত্তর দেওয়া হচ্ছে'
              : 'আপনি বাংলায় কথা বলুন...'}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            ইন্টারাপ্ট করতে যেকোনো সময় সরাসরি কথা বলুন অথবা 'থামান' বাটন চাপুন
          </p>
        </div>

        {/* Live Captions Subtitle Box (ক্যাপশন) */}
        {showCaptions && !isMinimized && (
          <div className="w-full max-w-lg mt-4 px-4 py-3 rounded-2xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-lg text-left transition-all">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 border-b border-zinc-800 pb-1">
              <span className="flex items-center gap-1 font-medium text-zinc-300">
                <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
                লাইভ বাংলা ক্যাপশন (Live Subtitles)
              </span>
              <span className="text-[10px] text-zinc-400">জিরো ল্যাটেন্সি</span>
            </div>

            {/* Interim or Latest User speech */}
            {(interimCaption || latestUserCaption) && (
              <div className="text-xs text-emerald-300 font-medium mb-1">
                <span className="text-zinc-400 font-normal">আপনি: </span>
                {interimCaption || latestUserCaption?.text}
              </div>
            )}

            {/* Latest Assistant reply */}
            {latestAssistantCaption ? (
              <div className="text-xs text-zinc-200 leading-relaxed font-sans">
                <span className="text-purple-400 font-medium">জিমিনি: </span>
                {latestAssistantCaption.text}
              </div>
            ) : (
              <div className="text-xs text-zinc-400 italic">
                কথোপকথন শুরু হলে এখানে ক্যাপশন দেখা যাবে...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Dock (Apple/ChatGPT Style Buttons) */}
      <div className="flex items-center justify-center gap-4 z-10 pt-2 pb-safe">
        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-[1.5px] font-medium text-xs transition-all shadow-md active:scale-95 ${
            isScreenSharing
              ? 'bg-blue-600/30 text-blue-200 border-blue-500/80'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800'
          }`}
          title="স্ক্রিন শেয়ারিং চালু/বন্ধ করুন"
        >
          <ScreenShare className="w-4 h-4 text-blue-400" />
          <span>{isScreenSharing ? 'স্ক্রিন বন্ধ' : 'স্ক্রিন শেয়ার'}</span>
        </button>

        {/* STOP / INTERRUPT Button (কথার মধ্যে ইন্টারাপশন) */}
        <button
          onClick={onInterrupt}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/20 text-amber-200 border-[1.5px] border-amber-500/80 hover:bg-amber-500/30 font-semibold text-xs transition-all shadow-md active:scale-95"
          title="কথার মধ্যে ইন্টারাপ্ট করুন বা থামান"
        >
          <StopCircle className="w-4 h-4 text-amber-400" />
          <span>থামান (ইন্টারাপ্ট)</span>
        </button>

        {/* End Call / Close Live Session */}
        <button
          onClick={() => {
            onDisconnect();
            onClose();
          }}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600/20 text-red-300 border-[1.5px] border-red-500/80 hover:bg-red-600/30 transition-all shadow-md active:scale-95"
          title="লাইভ কল শেষ করুন"
        >
          <PhoneOff className="w-5 h-5 text-red-400" />
        </button>
      </div>
    </div>
  );
};
