import React from 'react';
import { Home, MessageSquare, Settings, Sparkles, Radio } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isLiveActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  isLiveActive = false,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-t-[1.5px] border-zinc-800/90 shadow-2xl px-4 py-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Home Button (হোম) */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 ${
            currentTab === 'home'
              ? 'text-emerald-400 bg-zinc-800/80 border-[1.5px] border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-[1.5px] border-transparent'
          }`}
          aria-label="হোম মেনু"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-medium tracking-wide">হোম</span>
        </button>

        {/* 2. Chat Button (চ্যাট) with Live indicator if active */}
        <button
          onClick={() => onSelectTab('chat')}
          className={`flex flex-col items-center justify-center py-1.5 px-5 rounded-2xl transition-all duration-200 relative ${
            currentTab === 'chat'
              ? 'text-blue-400 bg-zinc-800/80 border-[1.5px] border-blue-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-[1.5px] border-transparent'
          }`}
          aria-label="চ্যাট ও লাইভ ভয়েস"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 mb-0.5" />
            {isLiveActive && (
              <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium tracking-wide">চ্যাট</span>
        </button>

        {/* 3. Settings Button (সেটিংস) */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 ${
            currentTab === 'settings'
              ? 'text-purple-400 bg-zinc-800/80 border-[1.5px] border-purple-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-[1.5px] border-transparent'
          }`}
          aria-label="সেটিংস"
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-medium tracking-wide">সেটিংস</span>
        </button>
      </div>
    </nav>
  );
};
