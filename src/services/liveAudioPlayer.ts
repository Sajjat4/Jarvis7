import { base64ToFloat32Array } from './audioUtils';

export class LiveAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlayingState: boolean = false;
  private analyser: AnalyserNode | null = null;
  private keepAliveOsc: OscillatorNode | null = null;

  public onPlaybackStatusChange?: (isPlaying: boolean) => void;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 24000 });
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(console.error);
    }
  }

  public playChunk(base64Pcm: string) {
    this.init();
    if (!this.ctx || !this.analyser) return;

    const float32 = base64ToFloat32Array(base64Pcm);
    if (float32.length === 0) return;

    const buffer = this.ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser);

    const currentTime = this.ctx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.025; // 25ms small safety margin
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.activeSources.push(source);

    if (!this.isPlayingState) {
      this.isPlayingState = true;
      this.onPlaybackStatusChange?.(true);
    }

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
      if (this.activeSources.length === 0) {
        this.isPlayingState = false;
        this.onPlaybackStatusChange?.(false);
      }
    };
  }

  /**
   * Immediately stops all active audio playback and resets timing.
   * Crucial for user interruption during live voice conversation.
   */
  public interrupt() {
    for (const source of this.activeSources) {
      try {
        source.stop(0);
        source.disconnect();
      } catch (e) {
        // Source might have already ended
      }
    }
    this.activeSources = [];
    if (this.isPlayingState) {
      this.isPlayingState = false;
      this.onPlaybackStatusChange?.(false);
    }
    if (this.ctx) {
      this.nextStartTime = this.ctx.currentTime;
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public enableKeepAlive(enable: boolean) {
    this.init();
    if (!this.ctx) return;

    if (enable && !this.keepAliveOsc) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(20, this.ctx.currentTime); // 20Hz subsonic
        gain.gain.setValueAtTime(0.0001, this.ctx.currentTime); // Inaudible
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        this.keepAliveOsc = osc;
      } catch (e) {
        console.warn('Keep-alive oscillator error:', e);
      }
    } else if (!enable && this.keepAliveOsc) {
      try {
        this.keepAliveOsc.stop();
        this.keepAliveOsc.disconnect();
      } catch (e) {}
      this.keepAliveOsc = null;
    }
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public close() {
    this.interrupt();
    this.enableKeepAlive(false);
    if (this.ctx) {
      this.ctx.close().catch(console.error);
      this.ctx = null;
    }
  }
}
