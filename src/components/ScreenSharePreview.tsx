import React, { useEffect, useRef } from 'react';
import { Eye, Monitor, X, Maximize2 } from 'lucide-react';

interface ScreenSharePreviewProps {
  stream: MediaStream | null;
  onStop: () => void;
}

export const ScreenSharePreview: React.FC<ScreenSharePreviewProps> = ({
  stream,
  onStop,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="fixed top-16 right-4 z-40 w-64 md:w-80 rounded-2xl overflow-hidden bg-zinc-950/95 border-[1.5px] border-blue-500/70 shadow-2xl backdrop-blur-md transition-all">
      {/* Header */}
      <div className="bg-zinc-900/90 px-3 py-1.5 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[11px] font-medium text-blue-200 flex items-center gap-1">
            <Monitor className="w-3 h-3 text-blue-400" />
            লাইভ স্ক্রিন শেয়ারিং
          </span>
        </div>
        <button
          onClick={onStop}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="স্ক্রিন শেয়ার বন্ধ করুন"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Video Preview */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-zinc-300 font-mono">
          1 FPS • জিমিনি লাইভ দেখছে
        </div>
      </div>
    </div>
  );
};
