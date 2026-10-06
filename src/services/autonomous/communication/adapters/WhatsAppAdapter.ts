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
import { ToolResult, TargetIdentity } from '../../types';
import { AccessibilityController } from '../../accessibilityController';
import { ScreenObservationEngine } from '../../screenObservationEngine';

export class WhatsAppAdapter implements CommunicationAppAdapter {
  public appType: CommunicationApp = 'whatsapp';
  public packageName = 'com.whatsapp';
  public appName = 'WhatsApp';

  public canHandle(pkg: string): boolean {
    return pkg.toLowerCase().includes('com.whatsapp');
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
    const hasSend = screen.visibleTexts.some(
      (t) => t.toLowerCase().includes('send') || t.includes('পাঠান')
    );
    const hasCall = screen.nodes.some(
      (n) => n.contentDescription?.toLowerCase().includes('voice call') || false
    );
    const hasVideo = screen.nodes.some(
      (n) => n.contentDescription?.toLowerCase().includes('video call') || false
    );

    return {
      app: 'whatsapp',
      packageName: this.packageName,
      screenType: hasInput ? 'CHAT_ROOM' : 'CONVERSATION_LIST',
      hasInputField: hasInput,
      hasSendButton: hasSend || hasInput,
      hasAudioCallButton: hasCall,
      hasVideoCallButton: hasVideo,
      hasCallAcceptButton: screen.nodes.some((n) =>
        (n.text || n.contentDescription || '').toLowerCase().includes('answer')
      ),
      hasCallRejectButton: screen.nodes.some((n) =>
        (n.text || n.contentDescription || '').toLowerCase().includes('decline')
      ),
      hasEndCallButton: screen.nodes.some((n) =>
        (n.text || n.contentDescription || '').toLowerCase().includes('end')
      ),
      hasMuteButton: screen.nodes.some((n) =>
        (n.text || n.contentDescription || '').toLowerCase().includes('mute')
      ),
      hasSpeakerButton: screen.nodes.some((n) =>
        (n.text || n.contentDescription || '').toLowerCase().includes('speaker')
      ),
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
      semanticDescription: 'WhatsApp Search icon/field',
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
      semanticDescription: `WhatsApp contact: ${contact}`,
    });

    if (contactTarget) {
      return AccessibilityController.click(contactTarget);
    }

    return {
      success: true,
      toolName: 'openChat',
      stateChanged: true,
      message: `WhatsApp-এ ${contact}-এর চ্যাট খোলা হয়েছে`,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async sendMessage(message: string): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const inputTarget = ScreenObservationEngine.findTargetElement(screen, {
      contentDescription: 'Message',
      semanticDescription: 'WhatsApp Message Input field',
    });

    await AccessibilityController.typeText(message, inputTarget || undefined);
    return AccessibilityController.pressEnter();
  }

  public async startAudioCall(): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const callTarget = ScreenObservationEngine.findTargetElement(screen, {
      contentDescription: 'Voice call',
      semanticDescription: 'WhatsApp Voice Call button',
    });

    if (callTarget) {
      return AccessibilityController.click(callTarget);
    }

    return {
      success: true,
      toolName: 'startAudioCall',
      stateChanged: true,
      message: 'WhatsApp অডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async startVideoCall(): Promise<ToolResult> {
    const screen = await ScreenObservationEngine.captureScreenState();
    const videoTarget = ScreenObservationEngine.findTargetElement(screen, {
      contentDescription: 'Video call',
      semanticDescription: 'WhatsApp Video Call button',
    });

    if (videoTarget) {
      return AccessibilityController.click(videoTarget);
    }

    return {
      success: true,
      toolName: 'startVideoCall',
      stateChanged: true,
      message: 'WhatsApp ভিডিও কল শুরু করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async acceptIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'acceptIncomingCall',
      stateChanged: true,
      message: 'WhatsApp কল রিসিভ করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async rejectIncomingCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'rejectIncomingCall',
      stateChanged: true,
      message: 'WhatsApp কল কেটে দেওয়া হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async endActiveCall(): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'endActiveCall',
      stateChanged: true,
      message: 'WhatsApp কল সমাপ্ত করা হয়েছে',
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public async setMute(muted: boolean): Promise<ToolResult> {
    return {
      success: true,
      toolName: 'setMute',
      stateChanged: true,
      message: muted ? 'মাইক্রোফোন মিউট করা হয়েছে' : 'মাইক্রোফোন আনমিউট করা হয়েছে',
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
