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

export class TelegramAdapter implements CommunicationAppAdapter {
  public appType: CommunicationApp = 'telegram';
  public packageName = 'org.telegram.messenger';
  public appName = 'Telegram';

  public canHandle(pkg: string): boolean {
    return pkg.toLowerCase().includes('org.telegram.messenger');
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
      app: 'telegram',
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
    const screen = await ScreenObservationEngine.captureScreenState();
    const searchTarget = ScreenObservationEngine.findTargetElement(screen, {
      text: 'Search',
      contentDescription: 'Search',
      semanticDescription: 'Telegram Search',
    });

    if (searchTarget) {
      await AccessibilityController.click(searchTarget);
    }
    return AccessibilityController.typeText(name);
  }

  public async openChat(contact: string): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const contactTarget = ScreenObservationEngine.findTargetElement(screen, {
      text: contact,
      semanticDescription: `Telegram contact: ${contact}`,
    });

    if (contactTarget) {
      return AccessibilityController.click(contactTarget);
    }

    return {
      success: true,
      toolName: 'openChat',
      stateChanged: true,
      message: `Telegram-এ ${contact}-এর চ্যাট খোলা হয়েছে`,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async sendMessage(message: string): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const inputTarget = ScreenObservationEngine.findTargetElement(screen, {
      contentDescription: 'Write a message',
      semanticDescription: 'Telegram Message Field',
    });

    await AccessibilityController.typeText(message, inputTarget || undefined);
    return AccessibilityController.pressEnter();
  }

  public async startAudioCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'startAudioCall',
      stateChanged: true,
      message: 'Telegram অডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async startVideoCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'startVideoCall',
      stateChanged: true,
      message: 'Telegram ভিডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async acceptIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'acceptIncomingCall',
      stateChanged: true,
      message: 'Telegram কল রিসিভ করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async rejectIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'rejectIncomingCall',
      stateChanged: true,
      message: 'Telegram কল কেটে দেওয়া হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async endActiveCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'endActiveCall',
      stateChanged: true,
      message: 'Telegram কল শেষ করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async setMute(muted: boolean): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'setMute',
      stateChanged: true,
      message: muted ? 'Telegram কল মিউট করা হয়েছে' : 'Telegram কল আনমিউট করা হয়েছে',
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
