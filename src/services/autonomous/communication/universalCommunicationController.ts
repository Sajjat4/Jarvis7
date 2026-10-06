/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommunicationApp,
  CommunicationAction,
  CommunicationIntent,
  IncomingCallState,
  PendingCallConfirmation,
  ActiveCallState,
  CallType,
} from './types';
import { CommunicationAppAdapter } from './adapters/CommunicationAppAdapter';
import { WhatsAppAdapter } from './adapters/WhatsAppAdapter';
import { MessengerAdapter } from './adapters/MessengerAdapter';
import { TelegramAdapter } from './adapters/TelegramAdapter';
import { SignalAdapter } from './adapters/SignalAdapter';
import { GenericMessagingAdapter } from './adapters/GenericMessagingAdapter';
import { ToolResult } from '../types';

export class UniversalCommunicationController {
  private static instance: UniversalCommunicationController;
  private adapters: Map<CommunicationApp, CommunicationAppAdapter> = new Map();
  private lastResolvedContact: string | null = null;
  private lastResolvedApp: CommunicationApp = 'whatsapp';

  private incomingCallState: IncomingCallState | null = null;
  private pendingConfirmation: PendingCallConfirmation | null = null;
  private activeCallState: ActiveCallState | null = null;
  private callTimer: any = null;

  private onIncomingCallListeners: Set<(state: IncomingCallState | null) => void> =
    new Set();
  private onActiveCallListeners: Set<(state: ActiveCallState | null) => void> =
    new Set();

  public static getInstance(): UniversalCommunicationController {
    if (!UniversalCommunicationController.instance) {
      UniversalCommunicationController.instance =
        new UniversalCommunicationController();
    }
    return UniversalCommunicationController.instance;
  }

  private constructor() {
    this.registerAdapter(new WhatsAppAdapter());
    this.registerAdapter(new MessengerAdapter());
    this.registerAdapter(new TelegramAdapter());
    this.registerAdapter(new SignalAdapter());
    this.registerAdapter(new GenericMessagingAdapter());
  }

  public registerAdapter(adapter: CommunicationAppAdapter) {
    this.adapters.set(adapter.appType, adapter);
  }

  public getAdapter(app: CommunicationApp): CommunicationAppAdapter {
    return this.adapters.get(app) || this.adapters.get('generic')!;
  }

  public subscribeIncomingCall(
    listener: (state: IncomingCallState | null) => void
  ): () => void {
    this.onIncomingCallListeners.add(listener);
    listener(this.incomingCallState);
    return () => this.onIncomingCallListeners.delete(listener);
  }

  public subscribeActiveCall(
    listener: (state: ActiveCallState | null) => void
  ): () => void {
    this.onActiveCallListeners.add(listener);
    listener(this.activeCallState);
    return () => this.onActiveCallListeners.delete(listener);
  }

  // =========================================================================
  // 1. INTENT PARSING & CONVERSATION CONTEXT RESOLUTION
  // =========================================================================
  public parseCommunicationIntent(text: string): CommunicationIntent | null {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // Determine target app
    let app: CommunicationApp = this.lastResolvedApp;
    if (lower.includes('whatsapp') || lower.includes('হোয়াটসঅ্যাপ')) {
      app = 'whatsapp';
    } else if (lower.includes('messenger') || lower.includes('মেসেঞ্জার')) {
      app = 'messenger';
    } else if (lower.includes('telegram') || lower.includes('টেলিগ্রাম')) {
      app = 'telegram';
    } else if (lower.includes('signal') || lower.includes('সিগন্যাল')) {
      app = 'signal';
    }

    // Determine action type
    const isVideoCall =
      lower.includes('video call') ||
      lower.includes('ভিডিও কল') ||
      lower.includes('ভিডিওতে কল');

    const isAudioCall =
      !isVideoCall &&
      (lower.includes('call') ||
        lower.includes('কল দাও') ||
        lower.includes('কল করো') ||
        lower.includes('ফোন দাও'));

    const isSendMessage =
      lower.includes('মেসেজ') ||
      lower.includes('message') ||
      lower.includes('বলো') ||
      lower.includes('পাঠাও') ||
      lower.includes('লিখে দাও');

    const isOpenChat =
      lower.includes('chat খুলো') ||
      lower.includes('চ্যাট খোলো') ||
      lower.includes('ইনবক্স খুলো');

    if (!isVideoCall && !isAudioCall && !isSendMessage && !isOpenChat) {
      return null;
    }

    // Extract Contact Name
    let contactName: string | undefined = undefined;

    // Resolve pronouns like "ওকে", "তাকে", "তাকে একটা মেসেজ দাও" from context
    if (
      lower.includes('ওকে') ||
      lower.includes('তাকে') ||
      lower.includes('উনাকে')
    ) {
      contactName = this.lastResolvedContact || 'Contact';
    } else {
      // Regex extraction pattern (e.g. "Telegram-এ Rahim-কে বলো...")
      const contactMatch = raw.match(
        /(?:whatsapp|হোয়াটসঅ্যাপ|messenger|মেসেঞ্জার|telegram|টেলিগ্রাম|signal|সিগন্যাল|-এ)?\s*([a-zA-Z\u0980-\u09FF\s]+?)(?:-কে|-রে|\s+কে|\s+রে)?\s+(?:বলো|মেসেজ|message|কল|call|video call|ভিডিও কল)/i
      );

      if (contactMatch && contactMatch[1]) {
        contactName = contactMatch[1]
          .replace(/(whatsapp|messenger|telegram|signal|এ|কে)/gi, '')
          .trim();
      }
    }

    if (contactName) {
      this.lastResolvedContact = contactName;
      this.lastResolvedApp = app;
    }

    // Extract message body if sending message
    let messageBody: string | undefined = undefined;
    if (isSendMessage) {
      const msgMatch = raw.match(
        /(?:বলো|মেসেজ দাও|মেসেজ পাঠাও|লিখে দাও|বলো যে)[:\s]+(.+)$/i
      );
      if (msgMatch && msgMatch[1]) {
        messageBody = msgMatch[1].trim();
      } else {
        messageBody = raw;
      }
    }

    let action: CommunicationAction = 'SEND_MESSAGE';
    let callType: CallType | undefined = undefined;

    if (isVideoCall) {
      action = 'START_VIDEO_CALL';
      callType = 'VIDEO';
    } else if (isAudioCall) {
      action = 'START_AUDIO_CALL';
      callType = 'AUDIO';
    } else if (isOpenChat) {
      action = 'OPEN_CHAT';
    }

    return {
      app,
      action,
      contactName: contactName || this.lastResolvedContact || undefined,
      message: messageBody,
      callType,
      confidence: 0.94,
      originalText: raw,
    };
  }

  // =========================================================================
  // 2. INCOMING CALL & FAST CONFIRMATION
  // =========================================================================
  public triggerIncomingCall(
    app: CommunicationApp,
    caller: string,
    callType: CallType = 'AUDIO'
  ): IncomingCallState {
    const callId = `call_${Date.now()}`;
    const state: IncomingCallState = {
      callId,
      detected: true,
      app,
      contactName: caller,
      callType,
      timestamp: Date.now(),
      confidence: 1.0,
      status: 'USER_CONFIRMATION_REQUIRED',
    };

    this.incomingCallState = state;
    this.pendingConfirmation = {
      callId,
      app,
      caller,
      callType,
      createdAt: Date.now(),
    };

    this.notifyIncomingCall(state);
    return state;
  }

  public async acceptPendingCall(): Promise<ToolResult> {
    if (!this.pendingConfirmation) {
      return {
        success: false,
        toolName: 'acceptPendingCall',
        message: 'কোনো অপেক্ষমাণ ইনকামিং কল পাওয়া যায়নি।',
        stateChanged: false,
        retryable: false,
        screenshotRecommended: false,
      };
    }

    const { callId, app, caller, callType } = this.pendingConfirmation;
    const adapter = this.getAdapter(app);
    const res = await adapter.acceptIncomingCall();

    this.incomingCallState = null;
    this.pendingConfirmation = null;
    this.notifyIncomingCall(null);

    // Transition to Active Call
    this.startActiveCall(callId, app, caller, callType);

    return res;
  }

  public async rejectPendingCall(): Promise<ToolResult> {
    if (!this.pendingConfirmation) {
      return {
        success: false,
        toolName: 'rejectPendingCall',
        message: 'কোনো অপেক্ষমাণ ইনকামিং কল নেই।',
        stateChanged: false,
        retryable: false,
        screenshotRecommended: false,
      };
    }

    const { app } = this.pendingConfirmation;
    const adapter = this.getAdapter(app);
    const res = await adapter.rejectIncomingCall();

    this.incomingCallState = null;
    this.pendingConfirmation = null;
    this.notifyIncomingCall(null);

    return res;
  }

  // =========================================================================
  // 3. ACTIVE CALL CONTROLS (Mute, Speaker, End)
  // =========================================================================
  public startActiveCall(
    callId: string,
    app: CommunicationApp,
    caller: string,
    callType: CallType = 'AUDIO'
  ) {
    if (this.callTimer) clearInterval(this.callTimer);

    const activeState: ActiveCallState = {
      active: true,
      callId,
      app,
      caller,
      callType,
      isMuted: false,
      isSpeakerOn: false,
      startTime: Date.now(),
      durationSeconds: 0,
    };

    this.activeCallState = activeState;
    this.notifyActiveCall(activeState);

    this.callTimer = setInterval(() => {
      if (this.activeCallState) {
        this.activeCallState.durationSeconds = Math.floor(
          (Date.now() - this.activeCallState.startTime) / 1000
        );
        this.notifyActiveCall({ ...this.activeCallState });
      }
    }, 1000);
  }

  public async toggleMute(): Promise<ToolResult> {
    if (!this.activeCallState) {
      return {
        success: false,
        toolName: 'toggleMute',
        message: 'কোনো কল চলমান নেই।',
        stateChanged: false,
        retryable: false,
        screenshotRecommended: false,
      };
    }

    const adapter = this.getAdapter(this.activeCallState.app);
    const nextMute = !this.activeCallState.isMuted;
    const res = await adapter.setMute(nextMute);
    this.activeCallState.isMuted = nextMute;
    this.notifyActiveCall({ ...this.activeCallState });
    return res;
  }

  public async toggleSpeaker(): Promise<ToolResult> {
    if (!this.activeCallState) {
      return {
        success: false,
        toolName: 'toggleSpeaker',
        message: 'কোনো কল চলমান নেই।',
        stateChanged: false,
        retryable: false,
        screenshotRecommended: false,
      };
    }

    const adapter = this.getAdapter(this.activeCallState.app);
    const nextSpeaker = !this.activeCallState.isSpeakerOn;
    const res = await adapter.setSpeaker(nextSpeaker);
    this.activeCallState.isSpeakerOn = nextSpeaker;
    this.notifyActiveCall({ ...this.activeCallState });
    return res;
  }

  public async endCall(): Promise<ToolResult> {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }

    if (!this.activeCallState) {
      return {
        success: true,
        toolName: 'endCall',
        message: 'কল শেষ হয়েছে।',
        stateChanged: true,
        retryable: false,
        screenshotRecommended: false,
      };
    }

    const adapter = this.getAdapter(this.activeCallState.app);
    const res = await adapter.endActiveCall();
    this.activeCallState = null;
    this.notifyActiveCall(null);
    return res;
  }

  public getPendingConfirmation(): PendingCallConfirmation | null {
    return this.pendingConfirmation;
  }

  public getActiveCall(): ActiveCallState | null {
    return this.activeCallState;
  }

  private notifyIncomingCall(state: IncomingCallState | null) {
    this.onIncomingCallListeners.forEach((l) => {
      try {
        l(state);
      } catch (e) {}
    });
  }

  private notifyActiveCall(state: ActiveCallState | null) {
    this.onActiveCallListeners.forEach((l) => {
      try {
        l(state);
      } catch (e) {}
    });
  }
}
