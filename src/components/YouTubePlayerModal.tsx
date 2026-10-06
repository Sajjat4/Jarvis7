import React, { useState, useEffect } from 'react';
import {
  Youtube,
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  ListVideo,
  Music2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { YouTubeVideoItem } from '../types';

interface YouTubePlayerModalProps {
  isOpen: boolean;
  video: YouTubeVideoItem | null;
  playlist?: YouTubeVideoItem[];
  onSelectVideo?: (video: YouTubeVideoItem) => void;
  onClose: () => void;
}

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  isOpen,
  video,
  playlist = [],
  onSelectVideo,
  onClose,
}) => {
  // Start in compact/docked bar mode so it doesn't block the chat
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  if (!isOpen || !video) return null;

  const youtubeDirectUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <div className="fixed top-14 left-4 right-4 z-40 max-w-lg mx-auto transition-all duration-300">
      <div className="rounded-2xl bg-zinc-950/95 border-[1.5px] border-red-500/70 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
        {/* Docked Compact Player Bar */}
        <div className="p-2.5 flex items-center justify-between gap-3 bg-zinc-900/90">
          {/* Thumbnail / Animated Equalizer Icon */}
          <div className="relative w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-red-600/20 text-red-400">
                <Music2 className="w-5 h-5 animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
          </div>

          {/* Title & Channel */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-600 text-white font-mono uppercase">
                Now Playing
              </span>
              <span className="text-[11px] text-zinc-400 truncate">
                {video.channelTitle || 'YouTube Music'}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-zinc-100 truncate mt-0.5">
              {video.title}
            </h3>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-1 shrink-0">
            <a
              href={youtubeDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/40 text-xs transition-colors"
              title="YouTube-এ খুলুন"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
              title={isExpanded ? 'ছোট করুন' : 'ভিডিও দেখুন'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video View (Shown only if user expands) */}
        {isExpanded && (
          <div className="p-3 bg-black border-t border-zinc-800 space-y-2">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&enablejsapi=1&rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {playlist.length > 1 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-zinc-400 font-semibold block">
                  সম্পর্কিত ভিডিও তালিকা:
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {playlist.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectVideo?.(p)}
                      className={`w-full p-1.5 rounded-lg text-left text-xs flex items-center justify-between ${
                        p.id === video.id
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="truncate text-[11px]">{p.title}</span>
                      {p.id === video.id && (
                        <span className="text-[9px] text-red-400 ml-1">চলছে</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
