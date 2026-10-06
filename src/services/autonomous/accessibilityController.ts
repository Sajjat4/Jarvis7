/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolResult, TargetIdentity, RectBounds } from './types';
import { ScreenObservationEngine } from './screenObservationEngine';

export class AccessibilityController {
  private static isServiceEnabled = true;
  private static onActionExecutedListener?: (action: string, detail?: string) => void;

  public static setServiceEnabled(enabled: boolean) {
    this.isServiceEnabled = enabled;
  }

  public static isEnabled(): boolean {
    return this.isServiceEnabled;
  }

  public static setOnActionExecuted(
    listener: (action: string, detail?: string) => void
  ) {
    this.onActionExecutedListener = listener;
  }

  public static async click(target: TargetIdentity): Promise<ToolResult> {
    if (!this.isServiceEnabled) {
      return {
        success: false,
        toolName: 'click',
        message: 'Accessibility Service নিষ্ক্রিয় আছে। অনুগ্রহ করে সেটিংসে পারমিশন দিন।',
        stateChanged: false,
        errorType: 'PERMISSION_MISSING',
        retryable: true,
        screenshotRecommended: true,
      };
    }

    this.onActionExecutedListener?.('click', target.semanticDescription);

    // Simulate gesture execution timing
    await this.delay(350);

    return {
      success: true,
      toolName: 'click',
      message: `${target.semanticDescription}-এ সফলভাবে ক্লিক করা হয়েছে (${target.source})`,
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
      data: { bounds: target.bounds, confidence: target.confidence },
    };
  }

  public static async typeText(
    text: string,
    target?: TargetIdentity
  ): Promise<ToolResult> {
    this.onActionExecutedListener?.('type_text', `"${text}"`);
    await this.delay(400);

    return {
      success: true,
      toolName: 'type_text',
      message: `ইনপুটে "${text}" টাইপ করা হয়েছে`,
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
      data: { text, targetDescription: target?.semanticDescription },
    };
  }

  public static async clearText(target?: TargetIdentity): Promise<ToolResult> {
    this.onActionExecutedListener?.('clear_text', target?.semanticDescription);
    await this.delay(200);

    return {
      success: true,
      toolName: 'clear_text',
      message: 'ইনপুট ফিল্ড ক্লিয়ার করা হয়েছে',
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public static async scrollDown(): Promise<ToolResult> {
    this.onActionExecutedListener?.('scroll_down', 'নিচে স্ক্রল');
    await this.delay(300);

    return {
      success: true,
      toolName: 'scroll_down',
      message: 'স্ক্রিন নিচে স্ক্রল করা হয়েছে',
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public static async scrollUp(): Promise<ToolResult> {
    this.onActionExecutedListener?.('scroll_up', 'উপরে স্ক্রল');
    await this.delay(300);

    return {
      success: true,
      toolName: 'scroll_up',
      message: 'স্ক্রিন উপরে স্ক্রল করা হয়েছে',
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public static async back(): Promise<ToolResult> {
    this.onActionExecutedListener?.('back', 'ব্যাক বাটন');
    await this.delay(250);

    return {
      success: true,
      toolName: 'back',
      message: 'পূর্বের স্ক্রিনে ফিরে যাওয়া হয়েছে (Back)',
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public static async home(): Promise<ToolResult> {
    this.onActionExecutedListener?.('home', 'হোম স্ক্রিন');
    ScreenObservationEngine.setForegroundApp('com.android.launcher', 'LauncherActivity');
    await this.delay(250);

    return {
      success: true,
      toolName: 'home',
      message: 'হোম স্ক্রিনে ফিরে যাওয়া হয়েছে (Home)',
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  public static async openApp(
    appName: string,
    packageName?: string
  ): Promise<ToolResult> {
    const pkg =
      packageName ||
      (appName.toLowerCase().includes('chrome')
        ? 'com.android.chrome'
        : appName.toLowerCase().includes('youtube')
        ? 'com.google.android.youtube'
        : 'com.example.app');

    ScreenObservationEngine.setForegroundApp(pkg, 'MainActivity');
    this.onActionExecutedListener?.('open_app', `${appName} (${pkg})`);
    await this.delay(500);

    return {
      success: true,
      toolName: 'open_app',
      message: `${appName} অ্যাপ্লিকেশন চালু করা হয়েছে (${pkg})`,
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
      data: { appName, packageName: pkg },
    };
  }

  public static async pressEnter(): Promise<ToolResult> {
    this.onActionExecutedListener?.('press_key', 'Enter / Search Key');
    await this.delay(400);

    return {
      success: true,
      toolName: 'press_key',
      message: 'সার্চ/সাবমিট বাটন কার্যকর করা হয়েছে (Enter)',
      stateChanged: true,
      retryable: false,
      screenshotRecommended: true,
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
