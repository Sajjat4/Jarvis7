/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Phone, PhoneOff, Video, PhoneCall } from 'lucide-react';
import { IncomingCallState } from '../../services/autonomous/communication/types';

interface IncomingCallBannerProps {
  incomingCall: IncomingCallState | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallBanner: React.FC<IncomingCallBannerProps> = ({
  incomingCall,
  onAccept,
  onReject,
}) => {
  if (!incomingCall || !incomingCall.detected) return null;

  const appName =
    incomingCall.app === 'whatsapp'
      ? 'WhatsApp'
      : incomingCall.app === 'messenger'
      ? 'Messenger'
      : incomingCall.app === 'telegram'
      ? 'Telegram'
      : incomingCall.app === 'signal'
      ? 'Signal'
      : 'Phone Call';

  const isVideo = incomingCall.callType === 'VIDEO';

  return (
    <div className="fixed top-12 left-4 right-4 z-50 max-w-lg mx-auto animate-bounce transition-all">
      <div className="rounded-3xl bg-zinc-950/98 border-[2px] border-emerald-500 shadow-2xl backdrop-blur-2xl p-4 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-pulse shrink-0">
              {isVideo ? (
                <Video className="w-5 h-5" />
              ) : (
                <PhoneCall className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  {appName} ইনকামিং {isVideo ? 'ভিডিও' : 'অডিও'} কল
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-zinc-100 truncate mt-1">
                {incomingCall.contactName}
              </h3>
              <p className="text-[11px] text-zinc-400">
                ভয়েসে বলুন: "ধরো" বা "কেটে দাও"
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>ধরুন (Accept)</span>
          </button>

          <button
            onClick={onReject}
            className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span>কেটে দিন (Decline)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
