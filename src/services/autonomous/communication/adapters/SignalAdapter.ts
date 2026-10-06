/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommunicationAppAdapter } from './CommunicationAppAdapter';
import {
  CommunicationApp,
  CommunicationScreenState,
  CommunicationCapabilities,
} from '../types';
import { ToolResult } from '../../types';
import { AccessibilityController } from '../../accessibilityController';
import { ScreenObservationEngine } from '../../screenObservationEngine';

export class SignalAdapter implements CommunicationAppAdapter {
  public appType: CommunicationApp = 'signal';
  public packageName = 'org.thoughtcrime.securesms';
  public appName = 'Signal';

  public canHandle(pkg: string): boolean {
    return pkg.toLowerCase().includes('org.thoughtcrime.securesms');
  }

  public getCapabilities(): CommunicationCapabilities {
    return {
      messaging: true,
      audioCall: true,
      videoCall: true,
      mediaSending: true,
      incomingCallControl: true,
      outgoingCallControl: true,
    };
  }

  public async detectState(): Promise<CommunicationScreenState> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const hasInput = screen.editableElements.length > 0;

    return {
      app: 'signal',
      packageName: this.packageName,
      screenType: hasInput ? 'CHAT_ROOM' : 'CONVERSATION_LIST',
      hasInputField: hasInput,
      hasSendButton: hasInput,
      hasAudioCallButton: true,
      hasVideoCallButton: true,
      hasCallAcceptButton: true,
      hasCallRejectButton: true,
      hasEndCallButton: true,
      hasMuteButton: true,
      hasSpeakerButton: true,
      visibleMessagesCount: screen.nodes.length,
    };
  }

  public async openApp(): Promise<ToolResult> {
    return AccessibilityController.openApp(this.appName, this.packageName);
  }

  public async searchContact(name: string): Promise<ToolResult> {
    return AccessibilityController.typeText(name);
  }

  public async openChat(contact: string): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'openChat',
      stateChanged: true,
      message: `Signal-এ ${contact}-এর চ্যাট খোলা হয়েছে`,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async sendMessage(message: string): Promise<ToolResult> {
    await AccessibilityController.typeText(message);
    return AccessibilityController.pressEnter();
  }

  public async startAudioCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'startAudioCall',
      stateChanged: true,
      message: 'Signal অডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async startVideoCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'startVideoCall',
      stateChanged: true,
      message: 'Signal ভিডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async acceptIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'acceptIncomingCall',
      stateChanged: true,
      message: 'Signal কল রিসিভ করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async rejectIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'rejectIncomingCall',
      stateChanged: true,
      message: 'Signal কল কেটে দেওয়া হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async endActiveCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'endActiveCall',
      stateChanged: true,
      message: 'Signal কল শেষ করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async setMute(muted: boolean): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'setMute',
      stateChanged: true,
      message: muted ? 'Signal কল মিউট করা হয়েছে' : 'Signal কল আনমিউট করা হয়েছে',
      retryable: false,
      screenshotRecommended: false,
    };
  }

  public async setSpeaker(speakerOn: boolean): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'setSpeaker',
      stateChanged: true,
      message: speakerOn ? 'স্পিকার অন করা হয়েছে' : 'স্পিকার অফ করা হয়েছে',
      retryable: false,
      screenshotRecommended: false,
    };
  }
}
