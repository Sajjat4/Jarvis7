import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, CheckCircle, Info, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>অ্যান্ড্রয়েড অ্যাপ হিসেবে ইনস্টল করা আছে</span>
      </div>
    );
  }

  // Chromium / Android / Desktop direct prompt
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-900/80 via-teal-900/80 to-cyan-900/80 border border-emerald-500/40 p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">অ্যান্ড্রয়েড নেটিভ অ্যাপ ইনস্টল করুন</h4>
                <p className="text-xs text-emerald-200/80">
                  হোম স্ক্রিনে সরাসরি ইনস্টল করে অ্যাপের মতো ব্যবহার করুন (অফলাইন সাপোর্ট সহ)
                </p>
              </div>
            </div>
            <button
              onClick={install}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 text-xs shadow-md transition-all active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>ইনস্টল APK</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95"
        title="Install BongoLive Android App"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span>Android App ইনস্টল</span>
      </button>
    );
  }

  // Mobile Browser fallback guide
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
      >
        <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
        <span>Android / iOS ইনস্টল নির্দেশিকা</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Android / iOS এ ইনস্টল করুন</h3>
                <p className="text-xs text-zinc-400">আপনার ফোনে অ্যাপ ফ্রেম ছাড়াই সম্পূর্ণ নেটিভ লুক পাবেন</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                <p className="font-semibold text-emerald-400 mb-1">Android (Chrome / Edge):</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>ব্রাউজারের ৩টি ডট মোথে (⋮) ট্যাপ করুন</li>
                  <li><strong className="text-white">"Install app"</strong> অথবা <strong className="text-white">"Add to Home screen"</strong> চাপুন</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                <p className="font-semibold text-cyan-400 mb-1">iOS (Safari):</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>সাফারির নিচের <strong className="text-white">Share (শেয়ার)</strong> আইকনে ট্যাপ করুন</li>
                  <li>নিচে স্ক্রল করে <strong className="text-white">"Add to Home Screen"</strong> চাপুন</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2.5 text-xs font-bold transition-all"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};
