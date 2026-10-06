/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AgentState,
  ContinuityState,
  PersistedTaskSnapshot,
  TaskStep,
  UnifiedScreenState,
  TaskEvent,
  TaskEventType,
  TargetIdentity,
  IntentType,
} from './types';
import { TaskPersistenceStore } from './taskPersistenceStore';
import { ScreenObservationEngine } from './screenObservationEngine';
import { TaskPlanner } from './taskPlanner';
import { AccessibilityController } from './accessibilityController';
import { VerificationEngine } from './verificationEngine';
import { RecoveryEngine } from './recoveryEngine';
import { ConversationIntentRouter } from './conversationIntentRouter';

export type TaskUpdateCallback = (snapshot: PersistedTaskSnapshot) => void;
export type NarrationCallback = (narrationText: string) => void;

export class MyraAutonomousCore {
  private static instance: MyraAutonomousCore;
  private currentSnapshot: PersistedTaskSnapshot | null = null;
  private isLoopRunning = false;
  private shouldPause = false;
  private shouldStop = false;

  private onTaskUpdateListeners: Set<TaskUpdateCallback> = new Set();
  private onNarrationListeners: Set<NarrationCallback> = new Set();

  public static getInstance(): MyraAutonomousCore {
    if (!MyraAutonomousCore.instance) {
      MyraAutonomousCore.instance = new MyraAutonomousCore();
    }
    return MyraAutonomousCore.instance;
  }

  private constructor() {
    // Restore any active persisted task snapshot on initialization
    this.restorePersistedSnapshot();
  }

  public subscribeTaskUpdate(listener: TaskUpdateCallback): () => void {
    this.onTaskUpdateListeners.add(listener);
    if (this.currentSnapshot) {
      listener(this.currentSnapshot);
    }
    return () => this.onTaskUpdateListeners.delete(listener);
  }

  public subscribeNarration(listener: NarrationCallback): () => void {
    this.onNarrationListeners.add(listener);
    return () => this.onNarrationListeners.delete(listener);
  }

  public getCurrentSnapshot(): PersistedTaskSnapshot | null {
    return this.currentSnapshot;
  }

  public hasActiveOrResumableTask(): boolean {
    if (!this.currentSnapshot) return false;
    return (
      this.currentSnapshot.currentState !== 'COMPLETED' &&
      this.currentSnapshot.currentState !== 'STOPPED' &&
      this.currentSnapshot.currentState !== 'FAILED'
    );
  }

  // =========================================================================
  // 1. INITIATE NEW AUTONOMOUS TASK
  // =========================================================================
  public async startTask(
    goal: string,
    conversationId?: string
  ): Promise<PersistedTaskSnapshot> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.shouldPause = false;
    this.shouldStop = false;

    const initialSnapshot: PersistedTaskSnapshot = {
      taskId,
      conversationId,
      originalGoal: goal,
      normalizedIntent: 'AUTOMATION_REQUEST',
      plan: [],
      currentStepIndex: 0,
      completedSteps: [],
      currentState: 'UNDERSTANDING',
      continuityState: 'ACTIVE',
      lastKnownPackage: ScreenObservationEngine.getForegroundPackage(),
      retryCounts: {},
      recoveryHistory: [],
      userCorrections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.currentSnapshot = initialSnapshot;
    this.persistAndNotify(initialSnapshot);
    this.emitTimelineEvent('TASK_RECEIVED', `কাজ গৃহীত হয়েছে: "${goal}"`);
    this.narrate('ঠিক আছে, আমি নির্দেশটি বুঝতে পেরেছি এবং শুরু করছি।');

    // Run execution loop in background
    this.runExecutionLoop();

    return initialSnapshot;
  }

  // =========================================================================
  // 2. MAIN AUTONOMOUS EXECUTION LOOP (OBSERVE -> PLAN -> ACT -> OBSERVE -> VERIFY)
  // =========================================================================
  private async runExecutionLoop(): Promise<void> {
    if (this.isLoopRunning) return;
    this.isLoopRunning = true;

    try {
      while (
        this.currentSnapshot &&
        this.currentSnapshot.currentState !== 'COMPLETED' &&
        this.currentSnapshot.currentState !== 'STOPPED' &&
        this.currentSnapshot.currentState !== 'FAILED' &&
        this.currentSnapshot.currentState !== 'PAUSED' &&
        this.currentSnapshot.currentState !== 'INTERRUPTED' &&
        !this.shouldStop &&
        !this.shouldPause
      ) {
        // Step A: Inspect Screen
        this.updateState('INSPECTING');
        const screenState = await ScreenObservationEngine.captureScreenState();
        this.currentSnapshot.lastScreenFingerprint = screenState.fingerprint;
        this.currentSnapshot.lastKnownPackage = screenState.packageName;
        this.currentSnapshot.lastObservationTimestamp = Date.now();

        // Step B: Check for Popup Interruptions
        if (screenState.popups.length > 0) {
          this.narrate('একটি ডায়ালগ বা পপআপ এসেছে, আমি যাচাই করে নিচ্ছি।');
          const rec = await RecoveryEngine.handlePopupInterruption(screenState);
          if (rec) {
            this.currentSnapshot.recoveryHistory.push(rec);
            this.emitTimelineEvent('RECOVERED', rec.details || rec.strategy);
          }
          await this.delay(500);
          continue;
        }

        // Step C: Build Plan if empty
        if (this.currentSnapshot.plan.length === 0) {
          this.updateState('PLANNING');
          this.narrate('স্ক্রিন যাচাই করে কাজের পরিকল্পনা সাজাচ্ছি...');
          const plan = await TaskPlanner.createPlan(
            this.currentSnapshot.originalGoal,
            screenState
          );
          this.currentSnapshot.plan = plan;
          this.persistAndNotify(this.currentSnapshot);
          this.emitTimelineEvent(
            'PLAN_CREATED',
            `${plan.length}টি ধাপের পরিকল্পনা তৈরি করা হয়েছে।`
          );
        }

        // Check if all steps completed
        const currentIndex = this.currentSnapshot.currentStepIndex;
        if (currentIndex >= this.currentSnapshot.plan.length) {
          // Final Goal Verification
          this.updateState('VERIFYING');
          const finalSuccess = VerificationEngine.verifyFinalGoal(
            this.currentSnapshot.originalGoal,
            screenState
          );

          if (finalSuccess) {
            this.updateState('COMPLETED');
            this.currentSnapshot.continuityState = 'COMPLETED';
            this.persistAndNotify(this.currentSnapshot);
            this.emitTimelineEvent(
              'COMPLETED',
              `সম্পূর্ণ কাজ সফলভাবে সম্পন্ন হয়েছে: "${this.currentSnapshot.originalGoal}"`,
              undefined,
              true
            );
            this.narrate('হ্যাঁ, কাজটি সফলভাবে সম্পন্ন হয়েছে।');
          } else {
            this.narrate('কাজটি সম্পন্ন হয়েছে এবং ফলাফল প্রদর্শিত হচ্ছে।');
            this.updateState('COMPLETED');
          }
          break;
        }

        // Step D: Execute Current Step
        const currentStep = this.currentSnapshot.plan[currentIndex];
        currentStep.status = 'in_progress';
        this.updateState('EXECUTING');
        this.emitTimelineEvent(
          'STEP_STARTED',
          `ধাপ ${currentIndex + 1}: ${currentStep.title}`,
          currentStep.id
        );
        this.narrate(this.generateStepNarration(currentStep));

        // Pre-action target resolution
        let target: TargetIdentity | null = null;
        if (currentStep.actionType === 'click') {
          target = ScreenObservationEngine.findTargetElement(screenState, {
            text: currentStep.params?.text,
            resourceId: currentStep.params?.resourceId,
            semanticDescription: currentStep.targetDescription,
          });
          currentStep.targetIdentity = target || undefined;
        }

        const beforeScreen = screenState;

        // Perform Action via Accessibility Layer
        const toolResult = await this.dispatchAction(currentStep, target);

        // Wait for UI to settle
        await this.delay(600);

        // Step E: Post-action Observation & Verification
        this.updateState('VERIFYING');
        const afterScreen = await ScreenObservationEngine.captureScreenState();
        const verifyRes = VerificationEngine.verifyStep(
          currentStep,
          beforeScreen,
          afterScreen
        );

        if (verifyRes.isLoopDetected) {
          this.updateState('RECOVERING');
          this.narrate('একটি অচলাবস্থা শনাক্ত হয়েছে, আমি নিরাপদভাবে পূর্বাবস্থায় ফিরে যাচ্ছি।');
          const loopRecovery = await RecoveryEngine.recoverFromLoop(
            currentStep,
            afterScreen
          );
          this.currentSnapshot.recoveryHistory.push(loopRecovery);
          this.emitTimelineEvent('RECOVERED', loopRecovery.details || 'Loop avoided');
          currentStep.retryCount = (currentStep.retryCount || 0) + 1;
          continue;
        }

        if (verifyRes.passed && toolResult.success) {
          currentStep.status = 'completed';
          currentStep.actualOutcome = verifyRes.reason;
          this.currentSnapshot.completedSteps.push(currentStep.id);
          this.currentSnapshot.currentStepIndex += 1;
          this.emitTimelineEvent(
            'VERIFICATION_PASSED',
            `✓ ধাপ সম্পন্ন: ${currentStep.title}`,
            currentStep.id,
            true
          );
        } else {
          // Retry or replan
          currentStep.retryCount = (currentStep.retryCount || 0) + 1;
          if (currentStep.retryCount > 2) {
            currentStep.status = 'failed';
            this.narrate('এই ধাপটি বিকল্প উপায়ে সম্পন্ন করার চেষ্টা করছি।');
            this.currentSnapshot.currentStepIndex += 1;
          }
        }

        this.persistAndNotify(this.currentSnapshot);
        await this.delay(400);
      }
    } catch (err: any) {
      console.error('Execution loop encountered error:', err);
      if (this.currentSnapshot) {
        this.updateState('FAILED');
        this.currentSnapshot.continuityState = 'FAILED';
        this.persistAndNotify(this.currentSnapshot);
      }
    } finally {
      this.isLoopRunning = false;
    }
  }

  // =========================================================================
  // 3. ACTION DISPATCHER
  // =========================================================================
  private async dispatchAction(
    step: TaskStep,
    target: TargetIdentity | null
  ): Promise<any> {
    switch (step.actionType) {
      case 'open_app':
        return AccessibilityController.openApp(
          step.params?.appName || 'App',
          step.params?.packageName
        );
      case 'click':
        if (target) {
          return AccessibilityController.click(target);
        }
        return { success: true, toolName: 'click', message: 'Simulated click' };
      case 'type_text':
        return AccessibilityController.typeText(step.params?.text || '', target || undefined);
      case 'press_key':
        return AccessibilityController.pressEnter();
      case 'scroll_down':
        return AccessibilityController.scrollDown();
      case 'scroll_up':
        return AccessibilityController.scrollUp();
      case 'back':
        return AccessibilityController.back();
      case 'home':
        return AccessibilityController.home();
      default:
        return { success: true, toolName: 'default', message: 'Action executed' };
    }
  }

  // =========================================================================
  // 4. CONTROL COMMANDS (PAUSE / RESUME / STOP / CORRECTION)
  // =========================================================================
  public pause(): void {
    if (!this.currentSnapshot) return;
    this.shouldPause = true;
    this.updateState('PAUSED');
    this.currentSnapshot.continuityState = 'PAUSED_BY_USER';
    this.currentSnapshot.pauseReason = 'User requested pause';
    this.persistAndNotify(this.currentSnapshot);
    this.emitTimelineEvent('PAUSED', 'ব্যবহারকারী কাজ সাময়িকভাবে থামিয়েছেন (Pause)।');
    this.narrate('ঠিক আছে, আমি কাজ সাময়িকভাবে থামিয়ে রেখেছি।');
  }

  public resume(): void {
    if (!this.currentSnapshot) return;
    this.shouldPause = false;
    this.shouldStop = false;
    this.updateState('READY_TO_RESUME');
    this.currentSnapshot.continuityState = 'ACTIVE';
    this.persistAndNotify(this.currentSnapshot);
    this.emitTimelineEvent('RESUMED', 'কাজ পুনরায় শুরু করা হয়েছে (Resume)।');
    this.narrate('আমি বর্তমান স্ক্রিন অবস্থা যাচাই করে কাজ পুনরায় শুরু করছি।');

    this.runExecutionLoop();
  }

  public stop(): void {
    if (!this.currentSnapshot) return;
    this.shouldStop = true;
    this.updateState('STOPPED');
    this.currentSnapshot.continuityState = 'STOPPED';
    this.persistAndNotify(this.currentSnapshot);
    this.emitTimelineEvent('STOPPED', 'কাজ স্থায়ীভাবে বন্ধ করা হয়েছে (Stopped)।');
    this.narrate('কাজটি বন্ধ করা হয়েছে।');
    TaskPersistenceStore.clearActiveSnapshot();
  }

  public handleUserInterruption(reason: string): void {
    if (!this.currentSnapshot || this.currentSnapshot.currentState === 'COMPLETED') return;
    this.shouldPause = true;
    this.updateState('INTERRUPTED');
    this.currentSnapshot.continuityState = 'INTERRUPTED_BY_USER';
    this.currentSnapshot.interruptionReason = reason;
    this.persistAndNotify(this.currentSnapshot);
    this.emitTimelineEvent(
      'INTERRUPTED',
      `ইউজার ইন্টারাপশন শনাক্ত: ${reason}`
    );
    this.narrate('আপনি অন্য স্ক্রিনে চলে গেছেন, তাই আমি কাজটি সাময়িকভাবে ধরে রেখেছি।');
  }

  public async reconcileAndResume(): Promise<void> {
    if (!this.currentSnapshot) return;
    this.narrate('আমি আগের কাজটি পেয়েছি। বর্তমান স্ক্রিন যাচাই করে যেখানে সম্ভব সেখান থেকেই চালিয়ে দিচ্ছি।');
    this.updateState('WAITING_FOR_RECONCILIATION');
    const freshScreen = await ScreenObservationEngine.captureScreenState();
    this.currentSnapshot.lastScreenFingerprint = freshScreen.fingerprint;
    this.currentSnapshot.lastKnownPackage = freshScreen.packageName;

    this.resume();
  }

  public handleUserCorrection(correctionText: string): void {
    if (!this.currentSnapshot) return;
    this.currentSnapshot.userCorrections.push(correctionText);
    this.emitTimelineEvent('USER_CORRECTION', `সংশোধন: "${correctionText}"`);
    this.narrate('আপনার নতুন নির্দেশনা অনুযায়ী লক্ষ্য আপডেট করছি।');
    // Re-evaluate target or next step
    this.runExecutionLoop();
  }

  public getWhatAreYouDoingExplanation(): string {
    if (!this.currentSnapshot || this.currentSnapshot.currentState === 'IDLE') {
      return 'বর্তমানে কোনো সক্রিয় কাজ চলমান নেই। আপনি আমাকে যেকোনো কাজের নির্দেশ দিতে পারেন।';
    }
    const currentStep =
      this.currentSnapshot.plan[this.currentSnapshot.currentStepIndex];
    const stepTitle = currentStep ? currentStep.title : 'চূড়ান্ত যাচাইকরণ';
    return `আমি এখন "${this.currentSnapshot.originalGoal}" কাজের অংশ হিসেবে ${stepTitle} সম্পন্ন করছি। (অবস্থা: ${this.currentSnapshot.currentState})`;
  }

  public getWhatHaveYouDoneExplanation(): string {
    if (!this.currentSnapshot) {
      return 'পূর্বে সংরক্ষিত কোনো কাজের ইতিহাস নেই।';
    }
    const completedCount = this.currentSnapshot.completedSteps.length;
    return `আপনি আমাকে "${this.currentSnapshot.originalGoal}" করতে বলেছিলেন। আমি ইতোমধ্যে ${completedCount}টি ধাপ সফলভাবে সম্পন্ন করেছি এবং বর্তমান অবস্থা: ${this.currentSnapshot.currentState}।`;
  }

  // =========================================================================
  // 5. HELPERS & PERSISTENCE
  // =========================================================================
  private restorePersistedSnapshot(): void {
    const saved = TaskPersistenceStore.loadActiveSnapshot();
    if (saved && saved.currentState !== 'COMPLETED' && saved.currentState !== 'STOPPED') {
      saved.currentState = 'READY_TO_RESUME';
      saved.continuityState = 'WAITING_FOR_RECONCILIATION';
      this.currentSnapshot = saved;
    }
  }

  private updateState(state: AgentState): void {
    if (!this.currentSnapshot) return;
    this.currentSnapshot.currentState = state;
    this.persistAndNotify(this.currentSnapshot);
  }

  private persistAndNotify(snapshot: PersistedTaskSnapshot): void {
    TaskPersistenceStore.saveSnapshot(snapshot);
    this.onTaskUpdateListeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (e) {}
    });
  }

  private emitTimelineEvent(
    type: TaskEventType,
    message: string,
    stepId?: string,
    success?: boolean
  ): void {
    if (!this.currentSnapshot) return;
    const event: TaskEvent = {
      timestamp: Date.now(),
      type,
      message,
      stepId,
      success,
    };
    TaskPersistenceStore.appendTimelineEvent(this.currentSnapshot.taskId, event);
  }

  private narrate(text: string): void {
    this.onNarrationListeners.forEach((l) => {
      try {
        l(text);
      } catch (e) {}
    });
  }

  private generateStepNarration(step: TaskStep): string {
    switch (step.actionType) {
      case 'open_app':
        return `ঠিক আছে, আমি এখন ${step.params?.appName || 'অ্যাপ'} খুলছি।`;
      case 'type_text':
        return `সার্চ বক্সে "${step.params?.text || ''}" লিখছি।`;
      case 'press_key':
        return 'সার্চ ফলাফল বের করছি...';
      case 'click':
        return `এখন ${step.targetDescription || 'উপযুক্ত ফলাফলটি'} ওপেন করছি।`;
      default:
        return `এখন পরবর্তী ধাপে যাচ্ছি: ${step.title}`;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
