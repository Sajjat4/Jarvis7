export class ScreenShareService {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private intervalId: any = null;
  private isSharingState: boolean = false;

  public onEnded?: () => void;
  public onStreamReady?: (stream: MediaStream) => void;

  public async start(onFrame: (base64Jpeg: string) => void): Promise<MediaStream> {
    if (this.isSharingState && this.stream) {
      return this.stream;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('আপনার ব্রাউজারটি স্ক্রিন শেয়ারিং সমর্থন করে না।');
    }

    const mediaStream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
      video: {
        cursor: 'always',
        frameRate: { ideal: 5, max: 10 },
      },
      audio: false,
    });

    this.stream = mediaStream;

    this.videoEl = document.createElement('video');
    this.videoEl.srcObject = mediaStream;
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    await this.videoEl.play();

    this.canvasEl = document.createElement('canvas');
    const ctx = this.canvasEl.getContext('2d');

    this.isSharingState = true;
    this.onStreamReady?.(mediaStream);

    // Capture initial frame immediately
    const captureFrame = () => {
      if (!this.videoEl || !this.canvasEl || !ctx || !this.isSharingState) return;
      if (this.videoEl.readyState >= 2) {
        const vw = this.videoEl.videoWidth || 800;
        const vh = this.videoEl.videoHeight || 450;
        // Limit width to 960px for low-latency transmission
        const maxDim = 960;
        const scale = Math.min(1, maxDim / Math.max(vw, vh));
        const w = Math.round(vw * scale);
        const h = Math.round(vh * scale);

        this.canvasEl.width = w;
        this.canvasEl.height = h;
        ctx.drawImage(this.videoEl, 0, 0, w, h);

        const dataUrl = this.canvasEl.toDataURL('image/jpeg', 0.65);
        const commaIdx = dataUrl.indexOf(',');
        if (commaIdx !== -1) {
          const base64 = dataUrl.substring(commaIdx + 1);
          onFrame(base64);
        }
      }
    };

    captureFrame();
    // Gemini Live API guideline: 1 frame per second (1000ms)
    this.intervalId = setInterval(captureFrame, 1000);

    const videoTrack = mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        this.stop();
        this.onEnded?.();
      };
    }

    return mediaStream;
  }

  public isSharing(): boolean {
    return this.isSharingState;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public stop() {
    this.isSharingState = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.stream) {
      try {
        this.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.stream = null;
    }

    if (this.videoEl) {
      try {
        this.videoEl.pause();
        this.videoEl.srcObject = null;
      } catch (e) {}
      this.videoEl = null;
    }

    this.canvasEl = null;
  }
}
