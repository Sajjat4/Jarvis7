import { AppSettings, LiveCaption } from '../types';
import { LiveAudioPlayer } from './liveAudioPlayer';
import { MicService } from './micService';
import { ScreenShareService } from './screenShareService';

export type LiveConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'interrupted'
  | 'error'
  | 'closed';

export class LiveClient {
  private ws: WebSocket | null = null;
  private audioPlayer: LiveAudioPlayer;
  private micService: MicService;
  private screenShareService: ScreenShareService;
  private status: LiveConnectionStatus = 'idle';
  private settings: AppSettings;

  public onStatusChange?: (status: LiveConnectionStatus) => void;
  public onCaption?: (caption: LiveCaption) => void;
  public onInterimCaption?: (text: string) => void;
  public onError?: (error: string) => void;
  public onAssistantSpeakingChange?: (isSpeaking: boolean) => void;
  public onMicVolumeChange?: (volume: number) => void;
  public onScreenShareChange?: (isSharing: boolean, stream: MediaStream | null) => void;
  public onToolCall?: (call: { callId: string; name: string; args: any }) => void;

  constructor(settings: AppSettings) {
    this.settings = settings;
    this.audioPlayer = new LiveAudioPlayer();
    this.micService = new MicService();
    this.screenShareService = new ScreenShareService();

    this.audioPlayer.onPlaybackStatusChange = (isPlaying) => {
      this.onAssistantSpeakingChange?.(isPlaying);
    };

    this.micService.onVolumeChange = (vol) => {
      this.onMicVolumeChange?.(vol);
    };

    // Auto-interruption when user starts speaking while assistant is speaking
    this.micService.onUserSpeaking = () => {
      if (this.audioPlayer.isPlaying()) {
        this.interrupt();
      }
    };

    this.screenShareService.onEnded = () => {
      this.onScreenShareChange?.(false, null);
    };
  }

  public updateSettings(newSettings: AppSettings) {
    this.settings = newSettings;
    this.audioPlayer.enableKeepAlive(newSettings.enableBackgroundMode);
  }

  public async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') return;

    this.setStatus('connecting');

    try {
      this.audioPlayer.init();
      if (this.settings.enableBackgroundMode) {
        this.audioPlayer.enableKeepAlive(true);
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send setup initialization with model, voice, system instructions
        const initPayload = {
          type: 'init',
          apiKey: this.settings.useCustomApiKey ? this.settings.customApiKey : undefined,
          model: this.settings.liveModel || 'gemini-3.8-live',
          voice: this.settings.voice || 'Kore',
          systemInstruction: this.settings.systemInstruction,
        };
        this.ws?.send(JSON.stringify(initPayload));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            this.setStatus('connected');
            // Start microphone streaming once session is ready
            this.startMicrophone();
          } else if (msg.type === 'audio') {
            if (msg.data) {
              this.audioPlayer.playChunk(msg.data);
            }
          } else if (msg.type === 'caption') {
            const caption: LiveCaption = {
              id: `${Date.now()}-${Math.random()}`,
              speaker: msg.speaker,
              text: msg.text,
              isInterim: false,
              timestamp: Date.now(),
            };
            this.onCaption?.(caption);
          } else if (msg.type === 'interim_caption') {
            this.onInterimCaption?.(msg.text);
          } else if (msg.type === 'tool_call') {
            this.onToolCall?.(msg);
          } else if (msg.type === 'interrupted') {
            this.audioPlayer.interrupt();
            this.onAssistantSpeakingChange?.(false);
          } else if (msg.type === 'error') {
            console.error('Live server error:', msg.error);
            this.onError?.(msg.error);
            this.setStatus('error');
          } else if (msg.type === 'closed') {
            this.setStatus('closed');
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket connection error:', e);
        this.onError?.('লাইভ সার্ভারের সাথে যোগাযোগ স্থাপন করা যায়নি।');
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        if (this.status !== 'error') {
          this.setStatus('closed');
        }
        this.stopMicrophone();
      };
    } catch (err: any) {
      console.error('Connection initiation failed:', err);
      this.onError?.(err?.message || 'কানেকশন ব্যর্থ হয়েছে।');
      this.setStatus('error');
    }
  }

  private async startMicrophone() {
    try {
      await this.micService.start((base64Pcm) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'audio',
              data: base64Pcm,
            })
          );
        }
      });
    } catch (err: any) {
      console.error('Microphone capture failed:', err);
      this.onError?.(
        'মাইক্রোফোনের এক্সেস পাওয়া যায়নি। অনুগ্রহ করে ব্রাউজার থেকে অনুমতি প্রদান করুন।'
      );
    }
  }

  private stopMicrophone() {
    this.micService.stop();
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      const stream = await this.screenShareService.start((base64Jpeg) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'video',
              data: base64Jpeg,
            })
          );
        }
      });
      this.onScreenShareChange?.(true, stream);
      return stream;
    } catch (err: any) {
      console.error('Screen share error:', err);
      this.onError?.(err?.message || 'স্ক্রিন শেয়ার শুরু করা যায়নি।');
      return null;
    }
  }

  public stopScreenShare() {
    this.screenShareService.stop();
    this.onScreenShareChange?.(false, null);
  }

  public isScreenSharing(): boolean {
    return this.screenShareService.isSharing();
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
    }
  }

  /**
   * User Interruption: stops assistant speech immediately and notifies server
   */
  public interrupt() {
    this.audioPlayer.interrupt();
    this.onAssistantSpeakingChange?.(false);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  public getAudioFrequencyData(): Uint8Array {
    return this.audioPlayer.getFrequencyData();
  }

  public getMicFrequencyData(): Uint8Array {
    return this.micService.getFrequencyData();
  }

  public isAssistantSpeaking(): boolean {
    return this.audioPlayer.isPlaying();
  }

  public isUserSpeaking(): boolean {
    return this.micService.isListening();
  }

  public sendToolResponse(callId: string, result: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'tool_response',
          callId,
          result,
        })
      );
    }
  }

  public getStatus(): LiveConnectionStatus {
    return this.status;
  }

  private setStatus(status: LiveConnectionStatus) {
    this.status = status;
    this.onStatusChange?.(status);
  }

  public disconnect() {
    this.stopMicrophone();
    this.stopScreenShare();
    this.audioPlayer.interrupt();

    if (this.ws) {
      try {
        this.ws.send(JSON.stringify({ type: 'close' }));
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.setStatus('idle');
  }

  public destroy() {
    this.disconnect();
    this.audioPlayer.close();
  }
}
