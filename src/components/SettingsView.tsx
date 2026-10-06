import React, { useState } from 'react';
import {
  Key,
  Cpu,
  Volume2,
  FileCode,
  ShieldCheck,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  Radio,
  Sliders,
  Sparkles,
  ExternalLink,
  Save,
  Youtube,
  Smartphone,
  Layers,
  Play,
} from 'lucide-react';
import { AppSettings, LiveVoiceName } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenAccessibility: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenAccessibility,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyInput, setKeyInput] = useState(settings.customApiKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // YouTube API state
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [youtubeKeyInput, setYoutubeKeyInput] = useState(settings.youtubeApiKey || '');
  const [ytSaveSuccess, setYtSaveSuccess] = useState(false);
  const [ytTestResult, setYtTestResult] = useState<string | null>(null);
  const [isTestingYt, setIsTestingYt] = useState(false);

  // Dynamic UI Test Suite results
  const [testResults, setTestResults] = useState<any[] | null>(null);

  const voices: { name: LiveVoiceName; label: string; desc: string }[] = [
    { name: 'Kore', label: 'কোরে (Kore)', desc: 'শান্ত, স্পষ্ট ও প্রাঞ্জল কথন' },
    { name: 'Zephyr', label: 'জেফির (Zephyr)', desc: 'বন্ধুভাবাপন্ন ও প্রাণবন্ত' },
    { name: 'Puck', label: 'পাক (Puck)', desc: 'চটপটে, উদ্যমী ও বুদ্ধিদীপ্ত' },
    { name: 'Fenrir', label: 'ফেনরির (Fenrir)', desc: 'গম্ভীর ও ধীরস্থির স্বর' },
    { name: 'Charon', label: 'কারন (Charon)', desc: 'ভারী, কর্তৃত্বপূর্ণ ও প্রজ্ঞাবান' },
  ];

  const liveModels = [
    {
      id: 'gemini-3.8-live',
      name: 'Gemini 3.8 Live (প্রস্তাবিত)',
      desc: 'জিরো ল্যাটেন্সি রিয়েল-টাইম বাইডাইরেকশনাল অডিও ও স্ক্রিন কনভারসেশন',
    },
    {
      id: 'gemini-3.8-live-extended-thinking',
      name: 'Gemini 3.8 Live Extended Thinking',
      desc: 'রিয়েল-টাইমে গভীর চিন্তাশীল যুক্তি ও কোডিং বিশ্লেষণ',
    },
  ];

  const chatModels = [
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite (সুপার ফাস্ট)',
      desc: 'অতি স্বল্প ল্যাটেন্সি ও দ্রুততম টেক্সট রেসপন্স',
    },
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash (সাধারণ)',
      desc: 'ভারসাম্যপূর্ণ নির্ভুল বুদ্ধিমত্তা ও ব্যাখ্যা',
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro Preview (জটিল কাজ)',
      desc: 'উচ্চতর গণিত, লজিক ও প্রফেশনাল সমস্যা সমাধান',
    },
  ];

  const handleSaveKey = () => {
    onUpdateSettings({
      customApiKey: keyInput.trim(),
      useCustomApiKey: Boolean(keyInput.trim()),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'হ্যালো! এটি একটি টেস্ট মেসেজ।',
          customApiKey: settings.useCustomApiKey ? keyInput.trim() : undefined,
          model: 'gemini-3.1-flash-lite',
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setTestResult('সফল: Gemini API সফলভাবে সংযোগ স্থাপন করেছে!');
      } else {
        setTestResult(`ব্যর্থ: ${data.error || 'সংযোগ হয়নি'}`);
      }
    } catch (e: any) {
      setTestResult(`ব্যর্থ: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveYoutubeKey = () => {
    onUpdateSettings({
      youtubeApiKey: youtubeKeyInput.trim(),
      useCustomYoutubeApiKey: Boolean(youtubeKeyInput.trim()),
    });
    setYtSaveSuccess(true);
    setTimeout(() => setYtSaveSuccess(false), 2500);
  };

  const handleTestYoutubeKey = async () => {
    setIsTestingYt(true);
    setYtTestResult(null);
    try {
      const res = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'বাংলা গান',
          apiKey: youtubeKeyInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.videos && data.videos.length > 0) {
        setYtTestResult('সফল: YouTube API সফলভাবে কাজ করছে!');
      } else {
        setYtTestResult(`ব্যর্থ: ${data.error || 'ভিডিও পাওয়া যায়নি'}`);
      }
    } catch (e: any) {
      setYtTestResult(`ব্যর্থ: ${e.message}`);
    } finally {
      setIsTestingYt(false);
    }
  };

  const defaultInstruction = `আপনি 'বঙ্গলাইভ এআই' (BongoLive AI) - একজন অত্যন্ত আধুনিক, বুদ্ধিমান এবং দ্রুত উত্তর দিতে সক্ষম বাংলা রিয়েল-টাইম অ্যান্ড্রয়েড ভয়েস ও স্ক্রিন সহকারী। 
নির্দেশনাবলী:
১. ব্যবহারকারীর সাথে মিষ্টি, অমায়িক ও সাবলীল বাংলায় কথা বলুন।
২. উত্তরগুলো সংক্ষেপ, অত্যন্ত প্রাসঙ্গিক ও কথ্য ভঙ্গিতে দিন যাতে কনভারসেশনে কোনো অপ্রয়োজনীয় দেরি বা ল্যাটেন্সি না হয়।
৩. যখন ব্যবহারকারী স্ক্রিন বা ক্যামেরা শেয়ার করবেন, স্ক্রিনের টেক্সট, ছবি বা কনটেন্ট গভীরভাবে লক্ষ্য করে নির্ভুলভাবে উত্তর দিন।
৪. ব্যবহারকারী মাঝপথে কথা বললে বা ইন্টারাপ্ট করলে বিনয়ের সাথে মেনে নিয়ে নতুন কথার তাৎক্ষণিক উত্তর দিন।
৫. ডিভাইস কন্ট্রোল ও টুলস ব্যবহারের নিয়ম:
   - ব্যবহারকারী যদি কোনো অ্যাপ লঞ্চ করতে বলেন (যেমন: YouTube, ক্যামেরা, ক্যালকুলেটর, নোটস, ক্লক ইত্যাদি), তবে উত্তরের শেষে লিখবেন: [ACTION:launch_app:AppName] (যেমন: [ACTION:launch_app:youtube], [ACTION:launch_app:calculator])
   - ব্যবহারকারী যদি YouTube-এ কোনো গান বা ভিডিও প্লে করতে বলেন, তবে লিখবেন: [ACTION:play_youtube:ভিডিওর নাম বা সার্চ কোয়েরি] (যেমন: [ACTION:play_youtube:সেরা বাংলা গান])
   - ব্যবহারকারী যদি তাজা খবর বা লেটেস্ট নিউজ শুনতে চান, তবে লিখবেন: [ACTION:get_news]
   - ব্যবহারকারী যদি স্ক্রিনে উপরে বা নিচে স্ক্রল করতে বলেন, লিখবেন: [ACTION:scroll_down] অথবা [ACTION:scroll_up]
   - ব্যবহারকারী যদি কিছু টাইপ করতে বলেন, লিখবেন: [ACTION:type_text:টেক্সট]
   - ব্যবহারকারী যদি টর্চলাইট বা ফ্ল্যাশলাইট জ্বালাতে বলেন, লিখবেন: [ACTION:toggle_flashlight]`;

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-100">সেটিংস ও কনফিগারেশন</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gemini Live এপিআই, YouTube এপিআই, মডেল ও অ্যান্ড্রয়েড পারমিশন
          </p>
        </div>
        <PWAInstallButton variant="compact" />
      </div>

      <PWAInstallButton variant="banner" />

      {/* 1. Gemini API Key Section */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-md space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-100">
              Gemini API Key কাস্টমাইজেশন
            </h2>
            <p className="text-[11px] text-zinc-400">
              সিস্টেম বা ব্যক্তিগত Gemini API Key নির্বাচন করুন
            </p>
          </div>
        </div>

        {/* Toggle Custom Key vs System */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 p-2.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
            <input
              type="radio"
              name="apiKeyMode"
              checked={!settings.useCustomApiKey}
              onChange={() => onUpdateSettings({ useCustomApiKey: false })}
              className="accent-emerald-500"
            />
            <span className="text-xs text-zinc-300 font-medium">
              ডিফল্ট সিস্টেম API Key ব্যবহার করুন (স্বয়ংক্রিয়)
            </span>
          </label>

          <label className="flex items-center space-x-2 p-2.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
            <input
              type="radio"
              name="apiKeyMode"
              checked={settings.useCustomApiKey}
              onChange={() => onUpdateSettings({ useCustomApiKey: true })}
              className="accent-emerald-500"
            />
            <span className="text-xs text-zinc-300 font-medium">
              আমার নিজস্ব Gemini API Key ব্যবহার করুন
            </span>
          </label>
        </div>

        {/* API Key Input */}
        {settings.useCustomApiKey && (
          <div className="space-y-2 pt-1">
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border-[1.5px] border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveKey}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveSuccess ? 'সংরক্ষিত হয়েছে!' : 'কী সেভ করুন'}</span>
              </button>

              <button
                onClick={handleTestKey}
                disabled={isTesting}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors border border-zinc-700"
              >
                {isTesting ? 'টেস্ট হচ্ছে...' : 'কানেকশন টেস্ট'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2 rounded-xl text-[11px] font-medium ${
                  testResult.startsWith('সফল')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {testResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. YouTube Data API Key Section */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
              <Youtube className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-100">
                YouTube Data API v3 সেটিংস
              </h2>
              <p className="text-[11px] text-zinc-400">
                ইউটিউব ভিডিও সার্চ ও সহজে প্লে করার জন্য API কী সেভ করুন
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="relative">
            <input
              type={showYoutubeKey ? 'text' : 'password'}
              value={youtubeKeyInput}
              onChange={(e) => setYoutubeKeyInput(e.target.value)}
              placeholder="YouTube API Key লিখুন বা পেস্ট করুন..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border-[1.5px] border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowYoutubeKey(!showYoutubeKey)}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
            >
              {showYoutubeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveYoutubeKey}
              className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{ytSaveSuccess ? 'সংরক্ষিত হয়েছে!' : 'YouTube কী সেভ করুন'}</span>
            </button>

            <button
              onClick={handleTestYoutubeKey}
              disabled={isTestingYt}
              className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors border border-zinc-700"
            >
              {isTestingYt ? 'টেস্ট হচ্ছে...' : 'সার্চ টেস্ট'}
            </button>
          </div>

          {ytTestResult && (
            <div
              className={`p-2 rounded-xl text-[11px] font-medium ${
                ytTestResult.startsWith('সফল')
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {ytTestResult}
            </div>
          )}

          <p className="text-[10px] text-zinc-500">
            * কী না দিলেও অ্যাপটির অটোমেটিক YouTube ভিডিও প্লেয়ার এবং সার্চ ফিচার নিরবচ্ছিন্নভাবে চলবে।
          </p>
        </div>
      </div>

      {/* 3. Android Accessibility & Assistant Device Tools */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-md space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-100">
              অ্যান্ড্রয়েড অ্যাক্সেসিবিলিটি ও ডিভাইস সার্ভিস
            </h2>
            <p className="text-[11px] text-zinc-400">
              স্ক্রল, টাইপ, অ্যাপ লঞ্চ ও ওভারলে পারমিশন
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Accessibility Service */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                অ্যাক্সেসিবিলিটি সার্ভিস সক্রিয় রাখুন
              </div>
              <div className="text-[11px] text-zinc-400">
                ভয়েসে স্ক্রল, টাইপ ও মোবাইল পরিচালনা করতে সাহায্য করে
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.accessibilityServiceEnabled}
              onChange={(e) =>
                onUpdateSettings({ accessibilityServiceEnabled: e.target.checked })
              }
              className="w-5 h-5 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Floating Overlay Window */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                ফ্লোটিং ওভারলে সার্ভিস (SYSTEM_ALERT_WINDOW)
              </div>
              <div className="text-[11px] text-zinc-400">
                লেটেস্ট নিউজ কার্ড ও ফ্লোটিং কন্ট্রোল বল প্রদর্শন
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.floatingOverlayEnabled}
              onChange={(e) =>
                onUpdateSettings({ floatingOverlayEnabled: e.target.checked })
              }
              className="w-5 h-5 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Model Selection */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-md space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-100">
              মডেল নির্বাচন ও ল্যাটেন্সি
            </h2>
            <p className="text-[11px] text-zinc-400">
              লাইভ ভয়েস ও চ্যাটের জন্য মডেল নির্বাচন করুন
            </p>
          </div>
        </div>

        {/* Live Model */}
        <div>
          <label className="text-[11px] font-medium text-zinc-300 block mb-1.5">
            রিয়েল-টাইম লাইভ ভয়েস ও স্ক্রিন মডেল:
          </label>
          <div className="space-y-2">
            {liveModels.map((m) => (
              <label
                key={m.id}
                className={`flex items-start space-x-2.5 p-3 rounded-2xl border-[1.5px] cursor-pointer transition-all ${
                  settings.liveModel === m.id
                    ? 'bg-blue-500/10 border-blue-500/70 text-zinc-100'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="liveModel"
                  checked={settings.liveModel === m.id}
                  onChange={() => onUpdateSettings({ liveModel: m.id })}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <div className="text-xs font-semibold text-zinc-200">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Fallback Chat Model */}
        <div>
          <label className="text-[11px] font-medium text-zinc-300 block mb-1.5">
            চ্যাট ও টেক্সট রেসপন্স মডেল:
          </label>
          <div className="space-y-2">
            {chatModels.map((m) => (
              <label
                key={m.id}
                className={`flex items-start space-x-2.5 p-3 rounded-2xl border-[1.5px] cursor-pointer transition-all ${
                  settings.chatModel === m.id
                    ? 'bg-emerald-500/10 border-emerald-500/70 text-zinc-100'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="chatModel"
                  checked={settings.chatModel === m.id}
                  onChange={() => onUpdateSettings({ chatModel: m.id })}
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="text-xs font-semibold text-zinc-200">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Assistant Voice Selection */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-md space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-100">
              অ্যাসিস্ট্যান্ট কণ্ঠস্বর (Voice Persona)
            </h2>
            <p className="text-[11px] text-zinc-400">
              Gemini Live এর ৫টি ভিন্ন কণ্ঠ থেকে পছন্দেরটি বাছাই করুন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {voices.map((v) => (
            <button
              key={v.name}
              onClick={() => onUpdateSettings({ voice: v.name })}
              className={`p-3 rounded-2xl border-[1.5px] text-left transition-all flex items-center justify-between ${
                settings.voice === v.name
                  ? 'bg-purple-500/15 border-purple-500/80 text-zinc-100 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-zinc-200">
                  {v.label}
                </div>
                <div className="text-[11px] text-zinc-400">{v.desc}</div>
              </div>
              {settings.voice === v.name && (
                <Check className="w-4 h-4 text-purple-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Live Audio & Background Mode Toggles */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-md space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-100">
              লাইভ ফিচার ও ব্যাকগ্রাউন্ড মোড
            </h2>
            <p className="text-[11px] text-zinc-400">
              ক্যাপশন ও ব্যাকগ্রাউন্ড সচল রাখার ব্যবস্থা
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Captions */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                লাইভ বাংলা ক্যাপশন দেখান
              </div>
              <div className="text-[11px] text-zinc-400">
                কথোপকথন চলার সময় রিয়েল-টাইম সাবটাইটেল
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableLiveCaptions}
              onChange={(e) =>
                onUpdateSettings({ enableLiveCaptions: e.target.checked })
              }
              className="w-5 h-5 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Background Mode */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                ব্যাকগ্রাউন্ডে সচল রাখুন (Background Execution)
              </div>
              <div className="text-[11px] text-zinc-400">
                অন্য অ্যাপে সুইচ করলেও অডিও ও নিউজ সচল থাকবে
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableBackgroundMode}
              onChange={(e) =>
                onUpdateSettings({ enableBackgroundMode: e.target.checked })
              }
              className="w-5 h-5 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Wake Lock */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                স্ক্রিন অন রাখুন (Wake Lock)
              </div>
              <div className="text-[11px] text-zinc-400">
                কনভারসেশন চলাকালীন ডিসপ্লে স্লিপ হওয়া প্রতিরোধ করবে
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableWakeLock}
              onChange={(e) =>
                onUpdateSettings({ enableWakeLock: e.target.checked })
              }
              className="w-5 h-5 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 7. Custom Bengali System Instruction */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 border-[1.5px] border-zinc-700/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-100">
                সিস্টেম নির্দেশনাবলী (System Prompt)
              </h2>
              <p className="text-[11px] text-zinc-400">
                সহকারীর ব্যক্তিত্ব ও আচরণ পরিবর্তন করুন
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              onUpdateSettings({ systemInstruction: defaultInstruction })
            }
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
            title="ডিফল্ট নির্দেশনায় রিসেট করুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <textarea
          rows={5}
          value={settings.systemInstruction}
          onChange={(e) =>
            onUpdateSettings({ systemInstruction: e.target.value })
          }
          className="w-full p-3 rounded-2xl bg-zinc-950 border-[1.5px] border-zinc-700 text-xs text-zinc-200 leading-relaxed focus:outline-none focus:border-indigo-500 resize-none font-sans"
        />
      </div>

      {/* Accessibility Button */}
      <button
        onClick={onOpenAccessibility}
        className="w-full p-4 rounded-3xl bg-zinc-900 hover:bg-zinc-800/90 border-[1.5px] border-zinc-700/80 shadow-md flex items-center justify-between text-left transition-all active:scale-[0.99]"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-zinc-800 text-emerald-400 border border-zinc-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-100">
              এক্সেসিবিলিটি ও পারমিশন ড্যাশবোর্ড
            </div>
            <div className="text-[11px] text-zinc-400">
              মাইক্রোফোন, স্ক্রিন, অ্যাক্সেসিবিলিটি সার্ভিস ও ফন্ট সাইজ
            </div>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-400">খুলুন &rarr;</span>
      </button>
    </div>
  );
};
