import { arrayBufferToBase64, float32To16BitPCM } from './audioUtils';

export class MicService {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isListeningState: boolean = false;

  public onVolumeChange?: (volume: number) => void;
  public onUserSpeaking?: () => void;

  public async start(onAudioData: (base64Pcm: string) => void) {
    if (this.isListeningState) return;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx({ sampleRate: 16000 });
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.3;

    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    // Buffer size 2048 gives ~128ms packets at 16kHz for responsive latency
    this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);

    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);

    let speakingCheckCounter = 0;

    this.processor.onaudioprocess = (e) => {
      if (!this.isListeningState) return;

      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = float32To16BitPCM(input);
      const b64 = arrayBufferToBase64(pcm16);
      onAudioData(b64);

      speakingCheckCounter++;
      if (speakingCheckCounter % 3 === 0) {
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += Math.abs(input[i]);
        }
        const avg = sum / input.length;
        this.onVolumeChange?.(Math.min(1, avg * 4));

        // If user speech energy is high enough, trigger onUserSpeaking for interruption
        if (avg > 0.08) {
          this.onUserSpeaking?.();
        }
      }
    };

    this.isListeningState = true;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  public stop() {
    this.isListeningState = false;

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) {}
      this.processor = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }
    if (this.stream) {
      try {
        this.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.stream = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}
