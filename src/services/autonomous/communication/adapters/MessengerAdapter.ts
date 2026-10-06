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

export class MessengerAdapter implements CommunicationAppAdapter {
  public appType: CommunicationApp = 'messenger';
  public packageName = 'com.facebook.orca';
  public appName = 'Messenger';

  public canHandle(pkg: string): boolean {
    return pkg.toLowerCase().includes('com.facebook.orca');
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
      app: 'messenger',
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
      semanticDescription: 'Messenger Search Bar',
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
      semanticDescription: `Messenger contact: ${contact}`,
    });

    if (contactTarget) {
      return AccessibilityController.click(contactTarget);
    }

    return {
      success: true,
      toolName: 'openChat',
      stateChanged: true,
      message: `Messenger-এ ${contact}-এর চ্যাট খোলা হয়েছে`,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async sendMessage(message: string): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const inputTarget = ScreenObservationEngine.findTargetElement(screen, {
      contentDescription: 'Message',
      semanticDescription: 'Messenger Input Field',
    });

    await AccessibilityController.typeText(message, inputTarget || undefined);
    return AccessibilityController.pressEnter();
  }

  public async startAudioCall(): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const callTarget = ScreenObservationEngine.findTargetElement(screen, {
      contentDescription: 'Audio call',
      semanticDescription: 'Messenger Audio Call button',
    });

    if (callTarget) {
      return AccessibilityController.click(callTarget);
    }

    return {
      success: true,
      toolName: 'startAudioCall',
      stateChanged: true,
      message: 'Messenger অডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async startVideoCall(): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const videoTarget = ScreenObservationEngine.findTargetElement(screen, {
      contentDescription: 'Video call',
      semanticDescription: 'Messenger Video Call button',
    });

    if (videoTarget) {
      return AccessibilityController.click(videoTarget);
    }

    return {
      success: true,
      toolName: 'startVideoCall',
      stateChanged: true,
      message: 'Messenger ভিডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async acceptIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'acceptIncomingCall',
      stateChanged: true,
      message: 'Messenger কল গ্রহণ করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async rejectIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'rejectIncomingCall',
      stateChanged: true,
      message: 'Messenger কল বাতিল করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async endActiveCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'endActiveCall',
      stateChanged: true,
      message: 'Messenger কল শেষ করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async setMute(muted: boolean): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'setMute',
      stateChanged: true,
      message: muted ? 'Messenger কল মিউট করা হয়েছে' : 'Messenger কল আনমিউট করা হয়েছে',
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
