/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bot, Play, RotateCcw, X, Sparkles } from 'lucide-react';
import { PersistedTaskSnapshot } from '../../services/autonomous/types';

interface ResumableTaskBannerProps {
  snapshot: PersistedTaskSnapshot | null;
  onResume: () => void;
  onRestart: () => void;
  onDismiss: () => void;
}

export const ResumableTaskBanner: React.FC<ResumableTaskBannerProps> = ({
  snapshot,
  onResume,
  onRestart,
  onDismiss,
}) => {
  if (
    !snapshot ||
    snapshot.currentState === 'COMPLETED' ||
    snapshot.currentState === 'STOPPED' ||
    snapshot.currentState === 'FAILED'
  ) {
    return null;
  }

  const currentStep = snapshot.plan[snapshot.currentStepIndex];
  const lastKnownDesc = currentStep
    ? currentStep.title
    : `${snapshot.completedSteps.length}টি ধাপ সম্পন্ন`;

  return (
    <div className="fixed top-16 left-4 right-4 z-40 max-w-lg mx-auto animate-fadeIn">
      <div className="rounded-3xl bg-zinc-950/98 border-[1.5px] border-amber-500/70 p-4 shadow-2xl backdrop-blur-2xl text-left space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100">
                পূর্বের একটি কাজ অসম্পূর্ণ আছে
              </h3>
              <p className="text-[11px] text-zinc-300 mt-0.5 font-medium">
                {snapshot.originalGoal}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
          <span>শেষ অবস্থা: <strong className="text-amber-300">{lastKnownDesc}</strong></span>
          <span className="text-[10px] font-mono text-zinc-500">
            {snapshot.completedSteps.length} / {snapshot.plan.length}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onResume}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>চালিয়ে যান (Continue)</span>
          </button>

          <button
            onClick={onRestart}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>নতুন করে শুরু</span>
          </button>
        </div>
      </div>
    </div>
  );
};
