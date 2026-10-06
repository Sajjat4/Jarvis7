/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { History, X, CheckCircle2, Clock, Bot, AlertTriangle } from 'lucide-react';
import { TaskEvent, PersistedTaskSnapshot } from '../../services/autonomous/types';
import { TaskPersistenceStore } from '../../services/autonomous/taskPersistenceStore';

interface TaskTimelineModalProps {
  isOpen: boolean;
  snapshot: PersistedTaskSnapshot | null;
  onClose: () => void;
}

export const TaskTimelineModal: React.FC<TaskTimelineModalProps> = ({
  isOpen,
  snapshot,
  onClose,
}) => {
  const [events, setEvents] = useState<TaskEvent[]>([]);

  useEffect(() => {
    if (isOpen && snapshot?.taskId) {
      const list = TaskPersistenceStore.getTimeline(snapshot.taskId);
      setEvents(list);
    }
  }, [isOpen, snapshot]);

  if (!isOpen || !snapshot) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-950 border-[1.5px] border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100">কাজের টাইমলাইন ও লগ</h2>
              <p className="text-[10px] text-zinc-400 truncate max-w-xs">
                {snapshot.originalGoal}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              কোনো টাইমলাইন ইভেন্ট রেকর্ড হয়নি।
            </div>
          ) : (
            events.map((ev, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
              >
                <div className="font-mono text-[10px] text-zinc-500 shrink-0 pt-0.5">
                  {new Date(ev.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-200">{ev.message}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    ইভেন্ট: {ev.type}
                  </div>
                </div>

                {ev.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
