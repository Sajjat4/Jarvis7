import React from 'react';
import {
  Mic,
  ScreenShare,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Sliders,
  Play,
  FileText,
  Code2,
  HelpCircle,
  Key,
  Newspaper,
  Youtube,
  Smartphone,
  ArrowDown,
} from 'lucide-react';
import { TabType, AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeMenuProps {
  onSelectTab: (tab: TabType) => void;
  onStartLiveVoice: () => void;
  onStartScreenShare: () => void;
  onOpenAccessibility: () => void;
  onSendPresetPrompt: (prompt: string) => void;
  onOpenNews: () => void;
  onOpenYouTube: (query?: string) => void;
  settings: AppSettings;
  isLiveActive: boolean;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({
  onSelectTab,
  onStartLiveVoice,
  onStartScreenShare,
  onOpenAccessibility,
  onSendPresetPrompt,
  onOpenNews,
  onOpenYouTube,
  settings,
  isLiveActive,
}) => {
  const quickActions = [
    {
      title: 'লাইভ ভয়েস কনভারসেশন',
      desc: 'জিরো ল্যাটেন্সিতে বাংলায় কথা বলুন',
      icon: Mic,
      color: 'emerald',
      action: onStartLiveVoice,
      badge: 'Gemini Live',
    },
    {
      title: 'স্ক্রিন শেয়ারিং মোড',
      desc: 'স্ক্রিন দেখে দেখে তাৎক্ষণিক সাহায্য নিন',
      icon: ScreenShare,
      color: 'blue',
      action: onStartScreenShare,
      badge: 'ভিজ্যুয়াল লাইভ',
    },
    {
      title: '৫টি তাজা খবর (ভয়েস স্পিকার)',
      desc: 'টাইটেল ও সামারি সহ সহকারীর কণ্ঠে খবর শুনুন',
      icon: Newspaper,
      color: 'amber',
      action: onOpenNews,
      badge: 'তাজা খবর',
    },
    {
      title: 'YouTube ভিডিও ও গান',
      desc: 'মুখে বলা গান বা ভিডিও সরাসরি প্লে করুন',
      icon: Youtube,
      color: 'red',
      action: () => onOpenYouTube('সেরা বাংলা গান'),
      badge: 'প্লেয়ার',
    },
    {
      title: 'স্মার্ট চ্যাট মেসেঞ্জার',
      desc: 'স্ট্রিমিং রিয়েল-টাইম কনভারসেশন',
      icon: MessageSquare,
      color: 'indigo',
      action: () => onSelectTab('chat'),
      badge: 'টেক্সট + ভয়েস',
    },
    {
      title: 'এক্সেসিবিলিটি ও ডিভাইস টুলস',
      desc: 'স্ক্রল, টাইপ ও পারমিশন কন্ট্রোল',
      icon: ShieldCheck,
      color: 'purple',
      action: onOpenAccessibility,
      badge: 'Android সার্ভিস',
    },
  ];

  const bengaliPromptPresets = [
    {
      title: 'শীর্ষ ৫টি খবর পাঠ',
      text: 'আজকের শীর্ষ ৫টি তাজা খবর টাইটেল ও সামারি সহ পড়ে শোনাও।',
      icon: Newspaper,
    },
    {
      title: 'ইউটিউবে গান প্লে করো',
      text: 'ইউটিউবে জনপ্রিয় রবীন্দ্রসংগীত ভিডিও প্লে করো।',
      icon: Youtube,
    },
    {
      title: 'স্ক্রিন দেখে সাহায্য',
      text: 'আমার স্ক্রিনে এখন কী দেখা যাচ্ছে তা বাংলায় সুন্দরভাবে ব্যাখ্যা করো।',
      icon: ScreenShare,
    },
    {
      title: 'ক্যালকুলেটর চালু করো',
      text: 'ক্যালকুলেটর অ্যাপ ওপেন করো।',
      icon: Sparkles,
    },
    {
      title: 'স্ক্রিন নিচে স্ক্রল করো',
      text: 'স্ক্রিনের নিচে স্ক্রল করো।',
      icon: ArrowDown,
    },
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-4 h-4 text-zinc-950 font-bold" />
            </div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
              <span>বঙ্গলাইভ এআই</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-normal border border-emerald-500/30">
                Zero Latency
              </span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            জিরো ল্যাটেন্সি রিয়েল-টাইম বাংলা ভয়েস ও ডিভাইস সহকারী
          </p>
        </div>

        {/* Live Active Pill */}
        {isLiveActive ? (
          <button
            onClick={onStartLiveVoice}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border-[1.5px] border-emerald-500/60 text-emerald-300 text-xs font-medium animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>লাইভ চলছে</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('settings')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border-[1.5px] border-zinc-700/80 text-zinc-300 text-xs hover:border-zinc-500 transition-colors"
          >
            <Key className="w-3 h-3 text-amber-400" />
            <span>
              {settings.useCustomApiKey ? 'কাস্টম কী' : 'সিস্টেম এপিআই'}
            </span>
          </button>
        )}
      </div>

      {/* Android Native PWA Banner */}
      <PWAInstallButton variant="banner" />

      {/* Main 6 Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              onClick={act.action}
              className="p-4 rounded-3xl bg-zinc-900/90 hover:bg-zinc-800/90 border-[1.5px] border-zinc-700/80 shadow-md text-left transition-all active:scale-[0.98] flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-zinc-800 border-[1.5px] border-zinc-700 group-hover:border-zinc-600 transition-colors">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium border border-zinc-700">
                    {act.badge}
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                  {act.title}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                  {act.desc}
                </p>
              </div>

              <div className="mt-3 flex items-center text-[11px] font-medium text-emerald-400 gap-1">
                <span>চালু করুন</span>
                <Play className="w-3 h-3 fill-current" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Realtime Live Engine Status Card */}
      <div className="p-4 rounded-3xl bg-zinc-900/80 border-[1.5px] border-zinc-700/80 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-200">
              সিস্টেম ও অ্যাসিস্ট্যান্ট ইঞ্জিন
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            রিয়েল-টাইম সচল
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400">ভয়েস মডেল</div>
            <div className="font-semibold text-emerald-400">
              {settings.liveModel}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400">ভয়েস চরিত্র</div>
            <div className="font-semibold text-blue-400">{settings.voice}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400">অ্যাক্সেসিবিলিটি সার্ভিস</div>
            <div className="font-semibold text-purple-400">
              {settings.accessibilityServiceEnabled ? 'অনুমোদিত' : 'নিষ্ক্রিয়'}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400">ডিভাইস টুলস</div>
            <div className="font-semibold text-emerald-400">সক্রিয়</div>
          </div>
        </div>
      </div>

      {/* Suggested Bengali Prompts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            ভয়েস ও কমান্ড প্রম্পটসমূহ
          </h2>
          <span className="text-[11px] text-zinc-400">ক্লিক করে নির্দেশ দিন</span>
        </div>

        <div className="space-y-2">
          {bengaliPromptPresets.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onSendPresetPrompt(preset.text);
                  onSelectTab('chat');
                }}
                className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800/90 border-[1.5px] border-zinc-700/80 shadow-sm flex items-center justify-between text-left transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 group-hover:text-emerald-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200 group-hover:text-emerald-300 transition-colors">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1">
                      {preset.text}
                    </div>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
