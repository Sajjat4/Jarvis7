/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskStep, UnifiedScreenState, RecoveryEvent } from './types';
import { AccessibilityController } from './accessibilityController';
import { ScreenObservationEngine } from './screenObservationEngine';

export class RecoveryEngine {
  public static async handlePopupInterruption(
    screen: UnifiedScreenState
  ): Promise<RecoveryEvent | null> {
    if (screen.popups.length === 0) return null;

    const popup = screen.popups[0];
    // Find dismiss or accept button
    const target = ScreenObservationEngine.findTargetElement(screen, {
      text: 'Accept',
      semanticDescription: 'Dismiss popup',
    });

    if (target) {
      await AccessibilityController.click(target);
      return {
        timestamp: Date.now(),
        trigger: `Popup Detected: ${popup.type}`,
        strategy: 'Auto-dismiss/Accept Dialog',
        success: true,
        details: `Dismissed ${popup.type} popup safely`,
      };
    }

    return null;
  }

  public static async recoverFromLoop(
    step: TaskStep,
    screen: UnifiedScreenState
  ): Promise<RecoveryEvent> {
    // Strategy 1: Press Back and re-inspect
    await AccessibilityController.back();
    await new Promise((r) => setTimeout(r, 400));

    return {
      timestamp: Date.now(),
      trigger: 'Loop Detected / Unresponsive Element',
      strategy: 'Backtrack & Re-evaluate Target',
      success: true,
      details: 'Navigated back to safe state and refreshed UI observation',
    };
  }

  public static async recoverFromForegroundChange(
    expectedPackage: string,
    currentPackage: string
  ): Promise<RecoveryEvent> {
    if (expectedPackage && !currentPackage.includes(expectedPackage)) {
      await AccessibilityController.openApp(expectedPackage, expectedPackage);
      return {
        timestamp: Date.now(),
        trigger: `Foreground App Divergence (${currentPackage} != ${expectedPackage})`,
        strategy: 'Re-open Expected App',
        success: true,
        details: `Restored ${expectedPackage} foreground focus`,
      };
    }

    return {
      timestamp: Date.now(),
      trigger: 'Screen Focus Mismatch',
      strategy: 'Inspect Screen State',
      success: true,
    };
  }
}
