import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Volume2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Radio,
  Clock,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { NewsItem } from '../types';

interface FloatingNewsCardProps {
  isOpen: boolean;
  newsList: NewsItem[];
  onClose: () => void;
  onAskAssistantToRead?: (newsText: string) => void;
  isAssistantSpeaking?: boolean;
}

export const FloatingNewsCard: React.FC<FloatingNewsCardProps> = ({
  isOpen,
  newsList,
  onClose,
  onAskAssistantToRead,
  isAssistantSpeaking = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || newsList.length === 0) return null;

  const currentItem = newsList[currentIndex] || newsList[0];

  const handleNext = () => {
    if (currentIndex < newsList.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (onAskAssistantToRead && newsList[nextIdx]) {
        onAskAssistantToRead(newsList[nextIdx].readText);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (onAskAssistantToRead && newsList[prevIdx]) {
        onAskAssistantToRead(newsList[prevIdx].readText);
      }
    }
  };

  return (
    <div className="fixed top-16 left-4 right-4 z-50 max-w-lg mx-auto animate-fadeIn">
      <div className="rounded-3xl bg-zinc-950/98 border-[1.5px] border-amber-500/80 shadow-2xl backdrop-blur-2xl overflow-hidden text-left flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-950/60 to-zinc-900 px-4 py-3 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-100">
                  শীর্ষ ৫টি তাজা খবর
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {currentIndex + 1} / {newsList.length}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                সহকারী সরাসরি বাংলায় পড়ে শোনাবে
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {onAskAssistantToRead && (
              <button
                onClick={() => onAskAssistantToRead(currentItem.readText)}
                className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all ${
                  isAssistantSpeaking
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 animate-pulse'
                    : 'bg-zinc-900 text-amber-300 border-amber-500/40 hover:bg-zinc-800'
                }`}
                title="সহকারীর কণ্ঠে শুনুন"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">
                  {isAssistantSpeaking ? 'বলা হচ্ছে...' : 'শুনুন'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Legible News Content */}
        <div className="p-5 space-y-3.5">
          {/* Category & Time */}
          <div className="flex items-center justify-between text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30 uppercase tracking-wider text-[11px]">
              {currentItem.category || 'তাজা খবর'}
            </span>
            <span className="text-zinc-500 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>আজকের আপডেট</span>
            </span>
          </div>

          {/* Title - Large & Prominent */}
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-snug">
            {currentItem.title}
          </h2>

          {/* Summary - Legible Bengali text */}
          <p className="text-sm text-zinc-300 leading-relaxed font-sans">
            {currentItem.summary}
          </p>

          {/* Stepper dots */}
          <div className="flex justify-center items-center gap-1.5 pt-2">
            {newsList.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  if (onAskAssistantToRead && newsList[i]) {
                    onAskAssistantToRead(newsList[i].readText);
                  }
                }}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="bg-zinc-950 px-4 py-2.5 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              currentIndex === 0
                ? 'opacity-30 border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>পূর্ববর্তী</span>
          </button>

          <span className="text-xs text-zinc-400 font-mono">
            {currentIndex + 1} of {newsList.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentIndex === newsList.length - 1}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              currentIndex === newsList.length - 1
                ? 'opacity-30 border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <span>পরবর্তী</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
