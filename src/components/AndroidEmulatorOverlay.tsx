import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ArrowDown,
  ArrowUp,
  Keyboard,
  Newspaper,
  Youtube,
  Camera,
  Calculator,
  FileText,
  Clock,
  Compass,
  Flashlight,
  Home,
  ArrowLeft,
  X,
  Volume2,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DeviceActionType } from '../types';

interface AndroidEmulatorOverlayProps {
  onExecuteAction: (action: DeviceActionType, param?: string) => void;
  onOpenNews: () => void;
  onOpenYouTube: (query?: string) => void;
  activeGesture: {
    type: DeviceActionType;
    text?: string;
  } | null;
  accessibilityEnabled: boolean;
  onOpenAccessibility: () => void;
}

export const AndroidEmulatorOverlay: React.FC<AndroidEmulatorOverlayProps> = ({
  onExecuteAction,
  onOpenNews,
  onOpenYouTube,
  activeGesture,
  accessibilityEnabled,
  onOpenAccessibility,
}) => {
  const [isOpenAssistiveMenu, setIsOpenAssistiveMenu] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // Functional mini-app states
  const [calcInput, setCalcInput] = useState('0');
  const [notes, setNotes] = useState<string[]>([
    'MYRA মিটিং নোটস',
    'আজকের তাজা খবর পর্যালোচনা',
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Watch for gestures to launch apps
  useEffect(() => {
    if (!activeGesture) return;

    if (activeGesture.type === 'scroll_down') {
      window.scrollBy({ top: 350, behavior: 'smooth' });
    } else if (activeGesture.type === 'scroll_up') {
      window.scrollBy({ top: -350, behavior: 'smooth' });
    } else if (activeGesture.type === 'toggle_flashlight') {
      setFlashlightOn((prev) => !prev);
    } else if (activeGesture.type === 'launch_app' && activeGesture.text) {
      const app = activeGesture.text.toLowerCase();
      if (app.includes('youtube') || app.includes('ইউটিউব')) {
        onOpenYouTube();
      } else if (app.includes('calc') || app.includes('ক্যালকুলেটর')) {
        setActiveApp('calculator');
      } else if (app.includes('camera') || app.includes('ক্যামেরা')) {
        setActiveApp('camera');
      } else if (app.includes('note') || app.includes('নোট')) {
        setActiveApp('notes');
      } else if (
        app.includes('clock') ||
        app.includes('ঘড়ি') ||
        app.includes('টাইমার')
      ) {
        setActiveApp('clock');
      }
    }
  }, [activeGesture, onOpenYouTube]);

  // Handle camera start/stop
  useEffect(() => {
    if (activeApp === 'camera') {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((s) => {
          setCameraStream(s);
          setCameraActive(true);
        })
        .catch(() => setCameraActive(false));
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
      setCameraActive(false);
    }
  }, [activeApp]);

  // Calculator helper
  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
    } else if (val === '=') {
      try {
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcInput(String(res));
      } catch (e) {
        setCalcInput('ত্রুটি');
      }
    } else {
      setCalcInput((prev) => (prev === '0' || prev === 'ত্রুটি' ? val : prev + val));
    }
  };

  return (
    <>
      {/* Flashlight Screen Glow Effect */}
      {flashlightOn && (
        <div className="fixed inset-0 z-50 bg-white/95 pointer-events-none transition-opacity duration-300 flex items-center justify-center">
          <div className="text-zinc-950 font-bold text-lg bg-zinc-100/90 px-6 py-3 rounded-full border shadow-2xl">
            🔦 টর্চলাইট সক্রিয়
          </div>
        </div>
      )}

      {/* Visual Gesture Swipe Ripple Indicator */}
      {activeGesture && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/90 text-zinc-950 font-bold text-xs shadow-2xl flex items-center gap-2 border-[1.5px] border-emerald-300">
            {activeGesture.type === 'scroll_down' && (
              <>
                <ArrowDown className="w-4 h-4 animate-bounce" />
                <span>নিচে স্ক্রল করা হচ্ছে...</span>
              </>
            )}
            {activeGesture.type === 'scroll_up' && (
              <>
                <ArrowUp className="w-4 h-4 animate-bounce" />
                <span>উপরে স্ক্রল করা হচ্ছে...</span>
              </>
            )}
            {activeGesture.type === 'type_text' && (
              <>
                <Keyboard className="w-4 h-4" />
                <span>টাইপ করা হচ্ছে: "{activeGesture.text}"</span>
              </>
            )}
            {activeGesture.type === 'launch_app' && (
              <>
                <Zap className="w-4 h-4" />
                <span>অ্যাপ চালু করা হচ্ছে: {activeGesture.text}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Android Assistive Touch Ball */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsOpenAssistiveMenu(!isOpenAssistiveMenu)}
          className={`w-12 h-12 rounded-full border-[1.5px] shadow-2xl flex items-center justify-center transition-all active:scale-90 ${
            isOpenAssistiveMenu
              ? 'bg-emerald-500 text-zinc-950 border-emerald-300 rotate-45'
              : 'bg-zinc-900/90 text-emerald-400 border-zinc-700 hover:border-emerald-500/80 backdrop-blur-md'
          }`}
          title="অ্যান্ড্রয়েড অ্যাক্সেসিবিলিটি সার্ভিস মেনু"
        >
          {isOpenAssistiveMenu ? (
            <X className="w-5 h-5" />
          ) : (
            <Smartphone className="w-5 h-5" />
          )}
        </button>

        {/* Assistive Menu Drawer */}
        {isOpenAssistiveMenu && (
          <div className="absolute bottom-14 right-0 w-72 p-3.5 rounded-3xl bg-zinc-950/95 border-[1.5px] border-zinc-700/90 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-2.5 text-xs max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                MYRA ফ্লোটিং সার্ভিস
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                Active
              </span>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                onClick={() => {
                  onExecuteAction('scroll_down');
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <ArrowDown className="w-4 h-4 text-blue-400" />
                <span className="text-[10px]">স্ক্রল ডাউন</span>
              </button>

              <button
                onClick={() => {
                  onExecuteAction('scroll_up');
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <ArrowUp className="w-4 h-4 text-blue-400" />
                <span className="text-[10px]">স্ক্রল আপ</span>
              </button>

              <button
                onClick={() => {
                  onOpenNews();
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <Newspaper className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">৫টি খবর</span>
              </button>

              <button
                onClick={() => {
                  onOpenYouTube('জনপ্রিয় বাংলা গান');
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <Youtube className="w-4 h-4 text-red-400" />
                <span className="text-[10px]">ইউটিউব</span>
              </button>

              <button
                onClick={() => {
                  setActiveApp('calculator');
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <Calculator className="w-4 h-4 text-amber-400" />
                <span className="text-[10px]">ক্যালকুলেটর</span>
              </button>

              <button
                onClick={() => {
                  setActiveApp('camera');
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <Camera className="w-4 h-4 text-purple-400" />
                <span className="text-[10px]">ক্যামেরা</span>
              </button>

              <button
                onClick={() => {
                  setActiveApp('notes');
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px]">নোটস</span>
              </button>

              <button
                onClick={() => {
                  setFlashlightOn(!flashlightOn);
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <Flashlight
                  className={`w-4 h-4 ${
                    flashlightOn ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                />
                <span className="text-[10px]">টর্চলাইট</span>
              </button>

              <button
                onClick={() => {
                  onOpenAccessibility();
                  setIsOpenAssistiveMenu(false);
                }}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-300"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-[10px]">পারমিশন</span>
              </button>
            </div>

            {/* Communication Automation Testing Triggers */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                কল ও মেসেজিং সিমুলেশন:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    import('../services/autonomous/communication/universalCommunicationController').then((m) => {
                      m.UniversalCommunicationController.getInstance().triggerIncomingCall('whatsapp', 'Rahim Ahmed', 'AUDIO');
                    });
                    setIsOpenAssistiveMenu(false);
                  }}
                  className="p-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold truncate"
                >
                  📞 WhatsApp কল
                </button>
                <button
                  onClick={() => {
                    import('../services/autonomous/communication/universalCommunicationController').then((m) => {
                      m.UniversalCommunicationController.getInstance().triggerIncomingCall('messenger', 'Rafi Khan', 'VIDEO');
                    });
                    setIsOpenAssistiveMenu(false);
                  }}
                  className="p-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-[10px] text-blue-300 font-semibold truncate"
                >
                  📹 Messenger ভিডিও
                </button>
                <button
                  onClick={() => {
                    import('../services/autonomous/communication/universalCommunicationController').then((m) => {
                      m.UniversalCommunicationController.getInstance().triggerIncomingCall('telegram', 'Karim Uddin', 'AUDIO');
                    });
                    setIsOpenAssistiveMenu(false);
                  }}
                  className="p-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold truncate"
                >
                  📞 Telegram কল
                </button>
                <button
                  onClick={() => {
                    import('../services/autonomous/communication/universalCommunicationController').then((m) => {
                      m.UniversalCommunicationController.getInstance().triggerIncomingCall('signal', 'Sabbir Hossain', 'AUDIO');
                    });
                    setIsOpenAssistiveMenu(false);
                  }}
                  className="p-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-[10px] text-purple-300 font-semibold truncate"
                >
                  📞 Signal কল
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Built-in Functional Mini Apps (Calculators, Camera, Notes, etc.) */}
      {activeApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border-[1.5px] border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
              <span className="font-bold text-xs text-zinc-100 capitalize">
                {activeApp === 'calculator' && 'ক্যালকুলেটর (Calculator)'}
                {activeApp === 'camera' && 'ক্যামেরা ভিউফাইন্ডার (Camera)'}
                {activeApp === 'notes' && 'বাংলা মেমো ও নোটস (Notes)'}
                {activeApp === 'clock' && 'ডিজিটাল ক্লক ও টাইমার (Clock)'}
              </span>
              <button
                onClick={() => setActiveApp(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App Body */}
            <div className="p-4">
              {/* CALCULATOR */}
              {activeApp === 'calculator' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-zinc-900 text-right text-lg font-mono text-emerald-400 overflow-x-auto border border-zinc-800">
                    {calcInput}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      'C',
                      '(',
                      ')',
                      '/',
                      '7',
                      '8',
                      '9',
                      '*',
                      '4',
                      '5',
                      '6',
                      '-',
                      '1',
                      '2',
                      '3',
                      '+',
                      '0',
                      '.',
                      '=',
                    ].map((btn) => (
                      <button
                        key={btn}
                        onClick={() => handleCalcBtn(btn)}
                        className={`p-3 rounded-xl font-bold text-xs transition-colors ${
                          btn === '='
                            ? 'bg-emerald-500 text-zinc-950 col-span-2'
                            : btn === 'C'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CAMERA */}
              {activeApp === 'camera' && (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                    {cameraActive && cameraStream ? (
                      <video
                        autoPlay
                        playsInline
                        muted
                        ref={(ref) => {
                          if (ref) ref.srcObject = cameraStream;
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-500">
                        ক্যামেরা চালু হচ্ছে...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => alert('ছবি ধারণ সম্পন্ন হয়েছে!')}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
                  >
                    ছবি তুলুন (Capture)
                  </button>
                </div>
              )}

              {/* NOTES */}
              {activeApp === 'notes' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="নতুন নোট লিখুন..."
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newNoteText.trim()) {
                          setNotes([newNoteText.trim(), ...notes]);
                          setNewNoteText('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-zinc-950 font-bold text-xs"
                    >
                      যুক্ত করুন
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {notes.map((n, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 flex justify-between items-center"
                      >
                        <span className="truncate">{n}</span>
                        <button
                          onClick={() =>
                            setNotes(notes.filter((_, idx) => idx !== i))
                          }
                          className="text-zinc-500 hover:text-red-400 text-xs ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CLOCK */}
              {activeApp === 'clock' && (
                <div className="text-center py-6 space-y-2">
                  <div className="text-3xl font-mono font-bold text-emerald-400">
                    {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-zinc-400 font-sans">
                    {new Date().toLocaleDateString('bn-BD', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
