/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommunicationApp,
  CommunicationScreenState,
  CommunicationCapabilities,
  CallType,
} from '../types';
import { ToolResult } from '../../types';

export interface CommunicationAppAdapter {
  appType: CommunicationApp;
  packageName: string;
  appName: string;

  canHandle(packageName: string): boolean;
  getCapabilities(): CommunicationCapabilities;
  detectState(): Promise<CommunicationScreenState>;
  openApp(): Promise<ToolResult>;
  searchContact(name: string): Promise<ToolResult>;
  openChat(contact: string): Promise<ToolResult>;
  sendMessage(message: string): Promise<ToolResult>;
  startAudioCall(): Promise<ToolResult>;
  startVideoCall(): Promise<ToolResult>;
  acceptIncomingCall(): Promise<ToolResult>;
  rejectIncomingCall(): Promise<ToolResult>;
  endActiveCall(): Promise<ToolResult>;
  setMute(muted: boolean): Promise<ToolResult>;
  setSpeaker(speakerOn: boolean): Promise<ToolResult>;
}
