/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolResult, TargetIdentity } from '../types';

export type CommunicationApp =
  | 'whatsapp'
  | 'messenger'
  | 'telegram'
  | 'signal'
  | 'generic';

export type CommunicationAction =
  | 'OPEN_APP'
  | 'SEARCH_CONTACT'
  | 'OPEN_CHAT'
  | 'READ_VISIBLE_MESSAGES'
  | 'SEND_MESSAGE'
  | 'SEND_MEDIA'
  | 'SEND_DOCUMENT'
  | 'START_AUDIO_CALL'
  | 'START_VIDEO_CALL'
  | 'HANDLE_INCOMING_AUDIO_CALL'
  | 'HANDLE_INCOMING_VIDEO_CALL'
  | 'REJECT_INCOMING_CALL'
  | 'END_ACTIVE_CALL'
  | 'MUTE_CALL'
  | 'UNMUTE_CALL'
  | 'ENABLE_SPEAKER'
  | 'DISABLE_SPEAKER'
  | 'NAVIGATE_BACK'
  | 'SCROLL_CHAT';

export type CallType = 'AUDIO' | 'VIDEO';

export type IncomingCallStatus =
  | 'NO_CALL'
  | 'RINGING'
  | 'USER_CONFIRMATION_REQUIRED'
  | 'ACCEPTING'
  | 'ACTIVE'
  | 'REJECTING'
  | 'ENDED'
  | 'FAILED';

export interface CommunicationIntent {
  app: CommunicationApp;
  action: CommunicationAction;
  contactName?: string;
  message?: string;
  callType?: CallType;
  confidence: number;
  originalText?: string;
  isAmbiguousContact?: boolean;
  ambiguousChoices?: string[];
}

export interface IncomingCallState {
  callId: string;
  detected: boolean;
  app: CommunicationApp;
  contactName: string;
  callType: CallType;
  timestamp: number;
  confidence: number;
  status: IncomingCallStatus;
}

export interface PendingCallConfirmation {
  callId: string;
  app: CommunicationApp;
  caller: string;
  callType: CallType;
  createdAt: number;
}

export interface ActiveCallState {
  active: boolean;
  callId: string;
  app: CommunicationApp;
  caller: string;
  callType: CallType;
  isMuted: boolean;
  isSpeakerOn: boolean;
  startTime: number;
  durationSeconds: number;
}

export interface CommunicationCapabilities {
  messaging: boolean;
  audioCall: boolean;
  videoCall: boolean;
  mediaSending: boolean;
  incomingCallControl: boolean;
  outgoingCallControl: boolean;
}

export interface CommunicationScreenState {
  app: CommunicationApp;
  packageName: string;
  screenType: 'CONVERSATION_LIST' | 'CHAT_ROOM' | 'INCOMING_CALL' | 'ACTIVE_CALL' | 'PROFILE' | 'UNKNOWN';
  currentContactName?: string;
  hasInputField: boolean;
  hasSendButton: boolean;
  hasAudioCallButton: boolean;
  hasVideoCallButton: boolean;
  hasCallAcceptButton: boolean;
  hasCallRejectButton: boolean;
  hasEndCallButton: boolean;
  hasMuteButton: boolean;
  hasSpeakerButton: boolean;
  visibleMessagesCount: number;
}
