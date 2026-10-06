/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  User,
} from 'lucide-react';
import { ActiveCallState } from '../../services/autonomous/communication/types';

interface ActiveCallModalProps {
  activeCall: ActiveCallState | null;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  activeCall,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
}) => {
  if (!activeCall || !activeCall.active) return null;

  const minutes = Math.floor(activeCall.durationSeconds / 60);
  const seconds = activeCall.durationSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;

  const appName =
    activeCall.app === 'whatsapp'
      ? 'WhatsApp'
      : activeCall.app === 'messenger'
      ? 'Messenger'
      : activeCall.app === 'telegram'
      ? 'Telegram'
      : activeCall.app === 'signal'
      ? 'Signal'
      : 'Phone Call';

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-fadeIn">
      <div className="rounded-3xl bg-zinc-950/98 border-[1.5px] border-emerald-500/70 p-4 shadow-2xl backdrop-blur-2xl text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-100 truncate">
                  {activeCall.caller}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {appName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{timeFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls: Mute, Speaker, End Call */}
        <div className="flex items-center justify-center gap-3 pt-1 border-t border-zinc-800">
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-2xl border transition-all ${
              activeCall.isMuted
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800'
            }`}
            title="মাইক্রোফোন মিউট / আনমিউট"
          >
            {activeCall.isMuted ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onToggleSpeaker}
            className={`p-3 rounded-2xl border transition-all ${
              activeCall.isSpeakerOn
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800'
            }`}
            title="স্পিকার অন / অফ"
          >
            {activeCall.isSpeakerOn ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onEndCall}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span>কেটে দিন (End Call)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
