/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  History,
  Activity,
} from 'lucide-react';
import { PersistedTaskSnapshot } from '../../services/autonomous/types';

interface AutonomousTaskCardProps {
  snapshot: PersistedTaskSnapshot | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOpenTimeline: () => void;
}

export const AutonomousTaskCard: React.FC<AutonomousTaskCardProps> = ({
  snapshot,
  onPause,
  onResume,
  onStop,
  onOpenTimeline,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!snapshot || snapshot.currentState === 'IDLE') return null;

  const isExecuting =
    snapshot.currentState === 'EXECUTING' ||
    snapshot.currentState === 'PLANNING' ||
    snapshot.currentState === 'INSPECTING' ||
    snapshot.currentState === 'VERIFYING';

  const isPaused =
    snapshot.currentState === 'PAUSED' ||
    snapshot.currentState === 'INTERRUPTED' ||
    snapshot.currentState === 'READY_TO_RESUME' ||
    snapshot.currentState === 'WAITING_FOR_RECONCILIATION';

  const isCompleted = snapshot.currentState === 'COMPLETED';

  return (
    <div className="fixed top-14 left-4 right-4 z-40 max-w-lg mx-auto animate-fadeIn transition-all duration-300">
      <div className="rounded-3xl bg-zinc-950/98 border-[1.5px] border-emerald-500/70 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col text-left">
        {/* Top Status Header */}
        <div className="bg-gradient-to-r from-emerald-950/70 to-zinc-900 px-4 py-3 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <Bot className={`w-4 h-4 ${isExecuting ? 'animate-bounce' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-100 truncate">
                  MYRA স্বয়ংক্রিয় অ্যাসিস্ট্যান্ট
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isPaused
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  }`}
                >
                  {isCompleted
                    ? '✓ সম্পন্ন'
                    : isPaused
                    ? '⏸ স্থগিত (Paused)'
                    : '⚡ রানিং...'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                লক্ষ্য: {snapshot.originalGoal}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <button
              onClick={onOpenTimeline}
              className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              title="কাজের টাইমলাইন দেখুন"
            >
              <History className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Step-by-Step Progress Checklist */}
        {isExpanded && (
          <div className="p-4 space-y-3 bg-zinc-950/90">
            {snapshot.plan.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {snapshot.plan.map((step, idx) => {
                  const isDone = step.status === 'completed';
                  const isCurrent =
                    step.status === 'in_progress' ||
                    idx === snapshot.currentStepIndex;

                  return (
                    <div
                      key={step.id}
                      className={`p-2 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : isCurrent
                          ? 'bg-zinc-900 border-emerald-500/60 text-zinc-100 shadow-sm font-semibold'
                          : 'bg-zinc-950 border-zinc-800/80 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isCurrent ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        )}
                        <span className="truncate">{step.title}</span>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-2">
                        {isDone
                          ? 'সম্পন্ন'
                          : isCurrent
                          ? 'চলমান'
                          : `ধাপ ${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>স্ক্রিন স্টেট বিশ্লেষণ ও পরিকল্পনা তৈরি হচ্ছে...</span>
              </div>
            )}

            {/* Task Controls */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isExecuting ? (
                  <button
                    onClick={onPause}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Pause className="w-3 h-3" />
                    <span>স্থগিত (Pause)</span>
                  </button>
                ) : (
                  <button
                    onClick={onResume}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>চালান (Continue)</span>
                  </button>
                )}

                <button
                  onClick={onStop}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-zinc-800 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Square className="w-3 h-3" />
                  <span>বন্ধ করুন</span>
                </button>
              </div>

              <span className="text-[10px] text-zinc-500 font-mono">
                {snapshot.completedSteps.length} / {snapshot.plan.length} ধাপ
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
