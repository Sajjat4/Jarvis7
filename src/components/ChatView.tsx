import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  ScreenShare,
  Image as ImageIcon,
  Sparkles,
  StopCircle,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Trash2,
  Subtitles,
  ExternalLink,
  Bot,
  User,
  Radio,
  Newspaper,
  Youtube,
  Play,
  MapPin,
  Search,
  Navigation,
  Globe,
  Compass,
  Map,
} from 'lucide-react';
import {
  ChatMessage,
  AppSettings,
  LiveCaption,
  GroundingFilterMode,
} from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    imageBase64?: string,
    groundingMode?: GroundingFilterMode
  ) => Promise<void>;
  onStartLiveVoice: () => void;
  onToggleScreenShare: () => void;
  onOpenNews: () => void;
  onOpenYouTube: (query?: string) => void;
  isLiveActive: boolean;
  isScreenSharing: boolean;
  isAssistantSpeaking: boolean;
  onInterrupt: () => void;
  onClearChat: () => void;
  settings: AppSettings;
  liveCaptions: LiveCaption[];
  interimCaption: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onStartLiveVoice,
  onToggleScreenShare,
  onOpenNews,
  onOpenYouTube,
  isLiveActive,
  isScreenSharing,
  isAssistantSpeaking,
  onInterrupt,
  onClearChat,
  settings,
  liveCaptions,
  interimCaption,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeGroundingFilter, setActiveGroundingFilter] =
    useState<GroundingFilterMode>('auto');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, liveCaptions, interimCaption]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isSending) return;

    const text = inputText.trim();
    const img = selectedImage || undefined;
    setInputText('');
    setSelectedImage(null);
    setIsSending(true);

    try {
      await onSendMessage(text, img, activeGroundingFilter);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(',');
        if (commaIdx !== -1) {
          setSelectedImage(result.substring(commaIdx + 1));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickStarters = [
    {
      title: 'গুগল ম্যাপস: কাছের রেস্তোরাঁ ও রুট',
      prompt: 'আমার আশেপাশের সেরা রেস্তোরাঁ এবং সেখানে যাওয়ার দিকনির্দেশনা ম্যাপে দেখাও।',
      type: 'maps' as GroundingFilterMode,
      icon: MapPin,
      color: 'blue',
    },
    {
      title: 'গুগল সার্চ: আজকের তাজা খবর ও ফ্যাক্ট',
      prompt: 'আজকের শীর্ষ আন্তর্জাতিক ও প্রযুক্তি খবরগুলো গুগল সার্চ করে তথ্যসূত্রসহ বলো।',
      type: 'search' as GroundingFilterMode,
      icon: Search,
      color: 'emerald',
    },
    {
      title: 'গুগল ম্যাপস: ঢাকা থেকে কক্সবাজার রুট',
      prompt: 'ঢাকা থেকে কক্সবাজার যাওয়ার সেরা রুট, দূরত্ব ও পর্যটন স্থানসমূহ ম্যাপে দেখাও।',
      type: 'maps' as GroundingFilterMode,
      icon: Navigation,
      color: 'purple',
    },
    {
      title: 'ইউটিউবে সেরা গান ও মিডিয়া প্লে',
      prompt: 'ইউটিউবে সেরা বাংলা গানের প্লেলিস্ট চালু করো।',
      type: 'auto' as GroundingFilterMode,
      icon: Youtube,
      color: 'red',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] max-w-lg mx-auto relative bg-zinc-950">
      {/* Top Header */}
      <div className="px-4 py-2.5 border-b-[1.5px] border-zinc-800/90 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-zinc-800 border-[1.5px] border-zinc-700 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-zinc-100">বঙ্গলাইভ চ্যাট</h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/30">
                Maps & Search Live
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>বাংলা রিয়েল-টাইম মোড</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* News floating button */}
          <button
            onClick={onOpenNews}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-[1.5px] border-zinc-700/80 transition-colors"
            title="৫টি তাজা খবর শুনুন"
          >
            <Newspaper className="w-3.5 h-3.5" />
          </button>

          {/* YouTube quick launcher */}
          <button
            onClick={() => onOpenYouTube('সেরা বাংলা গান')}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-red-400 border-[1.5px] border-zinc-700/80 transition-colors"
            title="ইউটিউব ভিডিও প্লেয়ার"
          >
            <Youtube className="w-3.5 h-3.5" />
          </button>

          {/* Screen share toggle */}
          <button
            onClick={onToggleScreenShare}
            className={`p-2 rounded-xl border-[1.5px] transition-all text-xs flex items-center gap-1 ${
              isScreenSharing
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/80 animate-pulse'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:text-zinc-200'
            }`}
            title="স্ক্রিন শেয়ারিং চালু/বন্ধ করুন"
          >
            <ScreenShare className="w-3.5 h-3.5" />
            {isScreenSharing && <span className="text-[10px] font-medium">লাইভ</span>}
          </button>

          {/* Gemini Live Voice Mode Trigger */}
          <button
            onClick={onStartLiveVoice}
            className={`px-3 py-1.5 rounded-xl border-[1.5px] transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isLiveActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/80 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 border-emerald-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isLiveActive ? 'ভয়েস অন' : 'লাইভ'}</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-red-400 border-[1.5px] border-zinc-800 transition-colors"
              title="চ্যাট হিস্ট্রি মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grounding Engine Mode Toggle Bar */}
      <div className="px-4 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-1 text-[11px]">
        <span className="text-zinc-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>গ্রাউন্ডিং মোড:</span>
        </span>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar font-medium">
          <button
            onClick={() => setActiveGroundingFilter('auto')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 ${
              activeGroundingFilter === 'auto'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-semibold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>অটো</span>
          </button>

          <button
            onClick={() => setActiveGroundingFilter('search')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 ${
              activeGroundingFilter === 'search'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 font-semibold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3 h-3 text-blue-400" />
            <span>গুগল সার্চ</span>
          </button>

          <button
            onClick={() => setActiveGroundingFilter('maps')}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 ${
              activeGroundingFilter === 'maps'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>গুগল ম্যাপস</span>
          </button>
        </div>
      </div>

      {/* Screen Sharing Active Bar */}
      {isScreenSharing && (
        <div className="bg-blue-950/40 border-b-[1.5px] border-blue-500/40 px-4 py-1.5 flex items-center justify-between text-[11px] text-blue-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>স্ক্রিন শেয়ারিং চালু আছে — জিমিনি আপনার স্ক্রিন দেখতে পাচ্ছে</span>
          </div>
          <button
            onClick={onToggleScreenShare}
            className="text-[10px] underline text-blue-300 hover:text-white"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Interruption Floating Banner */}
      {isAssistantSpeaking && (
        <div className="sticky top-14 z-30 mx-4 my-2 p-2.5 rounded-2xl bg-amber-500/20 border-[1.5px] border-amber-500/80 backdrop-blur-md shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-amber-200 font-medium">
            <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>সহকারী বাংলায় কথা বলছে...</span>
          </div>
          <button
            onClick={onInterrupt}
            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>থামান (ইন্টারাপ্ট)</span>
          </button>
        </div>
      )}

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6 space-y-5">
            <div className="w-14 h-14 rounded-3xl bg-zinc-900 border-[1.5px] border-zinc-700/80 flex items-center justify-center shadow-xl relative">
              <Sparkles className="w-7 h-7 text-emerald-400" />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-zinc-950">
                <Mic className="w-3 h-3" />
              </div>
            </div>

            <div className="max-w-xs">
              <h2 className="text-sm font-bold text-zinc-100">
                Google Search & Maps Grounding সহকারী
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                রিয়েল-টাইম গুগল সার্চের তাজা তথ্য এবং গুগল ম্যাপসের অবস্থান, রুট ও
                দিকনির্দেশনা সহ বাংলায় কথা বলুন।
              </p>
            </div>

            <div className="w-full space-y-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">
                দ্রুত শুরু করার কমান্ডসমূহ:
              </div>
              {quickStarters.map((starter, idx) => {
                const Icon = starter.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveGroundingFilter(starter.type);
                      onSendMessage(starter.prompt, undefined, starter.type);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border-[1.5px] border-zinc-700/70 text-xs text-zinc-300 text-left transition-all active:scale-[0.99] flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="p-1 rounded-lg bg-zinc-800 text-emerald-400 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate text-[11px] font-medium text-zinc-200">
                        {starter.title}
                      </span>
                    </div>
                    <Send className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400 shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const cleanContent = (msg.content || '').replace(/\[ACTION:[^\]]+\]/g, '').trim();
            if (!cleanContent && !msg.toolCall && !msg.imageThumbnail && !msg.groundingMetadata)
              return null;

            const webSources = msg.groundingMetadata?.webSources || [];
            const mapsPlaces = msg.groundingMetadata?.mapsPlaces || [];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                } group transition-all duration-200`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[88%] rounded-3xl p-3.5 text-xs leading-relaxed border-[1.5px] shadow-md relative transition-all ${
                    isUser
                      ? 'bg-gradient-to-br from-emerald-600/30 to-zinc-900 text-zinc-100 border-emerald-500/50 rounded-tr-md self-end ml-10'
                      : 'bg-zinc-900/95 text-zinc-100 border-zinc-700/80 rounded-tl-md self-start mr-10'
                  }`}
                >
                  {/* Image attachment if exists */}
                  {msg.imageThumbnail && (
                    <div className="mb-2 rounded-2xl overflow-hidden border border-zinc-700 max-h-48">
                      <img
                        src={`data:image/jpeg;base64,${msg.imageThumbnail}`}
                        alt="সংযুক্ত ছবি বা স্ক্রিন"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Dynamic Action / Tool Badge */}
                  {msg.toolCall && (
                    <div className="mb-2.5 p-2 rounded-2xl bg-zinc-950/80 border border-emerald-500/40 text-[11px] flex items-center justify-between gap-2 shadow-inner">
                      <div className="flex items-center gap-1.5 truncate text-emerald-300 font-semibold">
                        {msg.toolCall.name === 'play_youtube' ? (
                          <>
                            <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="truncate">
                              YouTube মিউজিক: {msg.toolCall.params?.query || 'গান'}
                            </span>
                          </>
                        ) : msg.toolCall.name === 'get_news' ? (
                          <>
                            <Newspaper className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>৫টি তাজা খবর ওপেন হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">
                              অ্যাকশন: {msg.toolCall.name}
                              {msg.toolCall.params?.query ? ` (${msg.toolCall.params.query})` : ''}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold shrink-0">
                        সফল
                      </span>
                    </div>
                  )}

                  {/* Message Text */}
                  <div className="whitespace-pre-wrap font-sans leading-relaxed selection:bg-emerald-500/30 text-[13px]">
                    {cleanContent}
                  </div>

                  {/* GOOGLE MAPS GROUNDING PLACES & DIRECTIONS CARD */}
                  {mapsPlaces.length > 0 && (
                    <div className="mt-3 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Google Maps লাইভ স্থান ও দিকনির্দেশনা:</span>
                      </div>
                      <div className="space-y-1.5">
                        {mapsPlaces.map((place, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-2 rounded-xl bg-zinc-950/80 border border-amber-500/30 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-zinc-100 text-[11px] truncate">
                                {place.title}
                              </div>
                              {place.address && (
                                <div className="text-[10px] text-zinc-400 truncate">
                                  {place.address}
                                </div>
                              )}
                            </div>

                            <a
                              href={place.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors"
                            >
                              <span>ম্যাপসে দেখুন</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GOOGLE SEARCH GROUNDING SOURCES CARD */}
                  {webSources.length > 0 && (
                    <div className="mt-3 p-3 rounded-2xl bg-blue-950/30 border border-blue-500/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>Google Search যাচাইকৃত তথ্যসূত্র ({webSources.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {webSources.map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-blue-200 border border-blue-500/30 text-[10px] flex items-center gap-1.5 max-w-[200px] truncate transition-colors"
                            title={source.title}
                          >
                            <span className="truncate">{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer tools: copy & timestamp */}
                  <div className="mt-2 pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 gap-2">
                    <span className="font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <button
                      onClick={() => handleCopy(msg.id, cleanContent)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-zinc-400 hover:text-zinc-200"
                      title="কপি করুন"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Interim Caption Overlay if talking */}
        {interimCaption && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl p-2.5 bg-emerald-950/40 border-[1.5px] border-emerald-500/40 text-emerald-200 text-xs italic animate-pulse">
              <span className="font-normal text-emerald-400">শুনছি... </span>
              {interimCaption}
            </div>
          </div>
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {activeGroundingFilter === 'maps'
                  ? 'গুগল ম্যাপস থেকে স্থান ও রুট অনুসন্ধান করা হচ্ছে...'
                  : activeGroundingFilter === 'search'
                  ? 'গুগল সার্চ থেকে রিয়েল-টাইম তথ্য সংগ্রহ করা হচ্ছে...'
                  : 'উত্তর তৈরি করা হচ্ছে...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/90">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={`data:image/jpeg;base64,${selectedImage}`}
              alt="প্রিভিউ"
              className="w-14 h-14 object-cover rounded-xl border border-zinc-700"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center font-bold shadow-md"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            title="ছবি বা স্ক্রিনশট যুক্ত করুন"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeGroundingFilter === 'maps'
                ? 'স্থান, রুট বা দিকনির্দেশনা জিজ্ঞাসা করুন...'
                : activeGroundingFilter === 'search'
                ? 'তাজা খবর, সাম্প্রতিক তথ্য বা ফ্যাক্ট-চেক...'
                : 'বাংলায় লিখুন বা কথা বলুন...'
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-900 border-[1.5px] border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isSending}
            className={`p-2.5 rounded-2xl transition-all shadow-md ${
              inputText.trim() || selectedImage
                ? 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 active:scale-95'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
