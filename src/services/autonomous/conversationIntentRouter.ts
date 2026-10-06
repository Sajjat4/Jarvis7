/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntentType, ControlActionType } from './types';
import { UniversalCommunicationController } from './communication/universalCommunicationController';

export interface IntentClassificationResult {
  intent: IntentType;
  controlAction?: ControlActionType | 'ACCEPT_CALL' | 'REJECT_CALL' | 'END_CALL' | 'MUTE_CALL' | 'SPEAKER_CALL';
  isFastDeterministic: boolean;
  confidence: number;
  extractedGoal?: string;
  correctionDetail?: string;
}

export class ConversationIntentRouter {
  public static classify(
    text: string,
    hasActiveTask: boolean = false
  ): IntentClassificationResult {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    const commController = UniversalCommunicationController.getInstance();
    const hasPendingCall = commController.getPendingConfirmation() !== null;
    const hasActiveCall = commController.getActiveCall() !== null;

    // 1. FAST-PATH CALL CONFIRMATION ("ধরো", "Receive করো", "কেটে দাও", "না")
    if (hasPendingCall) {
      if (
        lower === 'ধরো' ||
        lower === 'ধরুন' ||
        lower === 'receive' ||
        lower === 'receive করো' ||
        lower === 'হ্যাঁ' ||
        lower === 'হ্যা' ||
        lower === 'yes' ||
        lower === 'রিসিভ করো' ||
        lower.includes('ধরো') ||
        lower.includes('রিসিভ')
      ) {
        return {
          intent: 'CONTROL_COMMAND',
          controlAction: 'ACCEPT_CALL',
          isFastDeterministic: true,
          confidence: 1.0,
        };
      }

      if (
        lower === 'না' ||
        lower === 'কেটে দাও' ||
        lower === 'কেটে দিন' ||
        lower === 'কাটো' ||
        lower === 'no' ||
        lower === 'reject' ||
        lower === 'decline' ||
        lower.includes('কেটে দাও') ||
        lower.includes('কেটে দে')
      ) {
        return {
          intent: 'CONTROL_COMMAND',
          controlAction: 'REJECT_CALL',
          isFastDeterministic: true,
          confidence: 1.0,
        };
      }
    }

    // 2. FAST-PATH ACTIVE CALL CONTROLS ("Speaker on", "Mute", "কেটে দাও")
    if (hasActiveCall) {
      if (lower.includes('speaker on') || lower.includes('স্পিকার অন') || lower.includes('লাউডস্পিকার')) {
        return {
          intent: 'CONTROL_COMMAND',
          controlAction: 'SPEAKER_CALL',
          isFastDeterministic: true,
          confidence: 1.0,
        };
      }
      if (lower.includes('mute') || lower.includes('মিউট')) {
        return {
          intent: 'CONTROL_COMMAND',
          controlAction: 'MUTE_CALL',
          isFastDeterministic: true,
          confidence: 1.0,
        };
      }
      if (lower.includes('কেটে দাও') || lower.includes('call শেষ করো') || lower.includes('কল কাটো') || lower === 'end call') {
        return {
          intent: 'CONTROL_COMMAND',
          controlAction: 'END_CALL',
          isFastDeterministic: true,
          confidence: 1.0,
        };
      }
    }

    // 3. IMMEDIATE TASK CONTROL COMMANDS
    if (
      lower === 'pause' ||
      lower === 'hold' ||
      lower === 'থামো' ||
      lower === 'একটু দাঁড়াও' ||
      lower === 'থামুন' ||
      lower.includes('থামো')
    ) {
      return {
        intent: 'CONTROL_COMMAND',
        controlAction: 'PAUSE',
        isFastDeterministic: true,
        confidence: 1.0,
      };
    }

    if (
      lower === 'continue' ||
      lower === 'resume' ||
      lower === 'আবার চালাও' ||
      lower === 'চালু করো' ||
      lower === 'যেখানে ছিলে সেখান থেকে শুরু করো' ||
      lower === 'আগের কাজটা চালাও' ||
      lower.includes('চালিয়ে যাও') ||
      lower.includes('চালাও')
    ) {
      return {
        intent: 'CONTROL_COMMAND',
        controlAction: hasActiveTask ? 'RESUME' : 'CONTINUE_PREVIOUS',
        isFastDeterministic: true,
        confidence: 1.0,
      };
    }

    if (
      lower === 'stop' ||
      lower === 'cancel' ||
      lower === 'বন্ধ করো' ||
      lower === 'এই কাজ আর করো না' ||
      lower.includes('কাজ বন্ধ করো') ||
      lower.includes('ক্যানসেল করো')
    ) {
      return {
        intent: 'TASK_CANCEL',
        controlAction: 'STOP',
        isFastDeterministic: true,
        confidence: 1.0,
      };
    }

    if (
      lower.includes('কি করছ') ||
      lower.includes('কী করছ') ||
      lower.includes('what are you doing') ||
      lower.includes('বর্তমান অবস্থা')
    ) {
      return {
        intent: 'CONTROL_COMMAND',
        controlAction: 'WHAT_ARE_YOU_DOING',
        isFastDeterministic: true,
        confidence: 0.98,
      };
    }

    if (
      lower.includes('কি কি করেছ') ||
      lower.includes('কী করেছ') ||
      lower.includes('what have you done') ||
      lower.includes('অগ্রগতি')
    ) {
      return {
        intent: 'CONTROL_COMMAND',
        controlAction: 'WHAT_HAVE_YOU_DONE',
        isFastDeterministic: true,
        confidence: 0.98,
      };
    }

    // 4. TASK CORRECTIONS
    if (
      hasActiveTask &&
      (lower.startsWith('না,') ||
        lower.startsWith('না ') ||
        lower.includes('ওটা না') ||
        lower.includes('আগেরটা করো') ||
        lower.includes('ডান পাশেরটা') ||
        lower.includes('বাম পাশেরটা'))
    ) {
      return {
        intent: 'TASK_CORRECTION',
        isFastDeterministic: false,
        confidence: 0.95,
        correctionDetail: raw,
      };
    }

    // 5. COMMUNICATION TASK DETECTION (WhatsApp, Telegram, Messenger, Signal)
    const commIntent = commController.parseCommunicationIntent(raw);
    if (commIntent) {
      return {
        intent: 'AUTOMATION_REQUEST',
        isFastDeterministic: false,
        confidence: commIntent.confidence,
        extractedGoal: raw,
      };
    }

    // 6. GENERAL AUTOMATION REQUESTS
    const isAutomationKeywords =
      lower.includes('খুলে') ||
      lower.includes('খোল') ||
      lower.includes('সার্চ করো') ||
      lower.includes('search করো') ||
      lower.includes('প্লে করো') ||
      lower.includes('চালু করো') ||
      lower.includes('ক্লিক করো') ||
      lower.includes('টাইপ করো') ||
      lower.includes('গিয়ে') ||
      lower.includes('ওপেন করো') ||
      lower.includes('করে দাও') ||
      lower.includes('ডাউনলোড করো') ||
      lower.includes('browser') ||
      lower.includes('chrome') ||
      lower.includes('youtube');

    if (isAutomationKeywords) {
      return {
        intent: 'AUTOMATION_REQUEST',
        isFastDeterministic: false,
        confidence: 0.92,
        extractedGoal: raw,
      };
    }

    // 7. SCREEN INSPECTION QUESTION
    if (
      lower.includes('স্ক্রিনে কী') ||
      lower.includes('স্ক্রিন দেখে বলো') ||
      lower.includes('what is on screen') ||
      lower.includes('স্ক্রিনে কি দেখতে পাচ্ছ')
    ) {
      return {
        intent: 'SCREEN_QUESTION',
        isFastDeterministic: false,
        confidence: 0.95,
      };
    }

    // 8. Normal Conversation fallback
    return {
      intent: 'NORMAL_CONVERSATION',
      isFastDeterministic: false,
      confidence: 0.85,
    };
  }
}
