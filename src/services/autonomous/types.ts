/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgentState =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'PLANNING'
  | 'INSPECTING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'RECOVERING'
  | 'PAUSED'
  | 'INTERRUPTED'
  | 'BACKGROUNDED'
  | 'WAITING_FOR_USER'
  | 'WAITING_FOR_RECONCILIATION'
  | 'READY_TO_RESUME'
  | 'COMPLETED'
  | 'FAILED'
  | 'STOPPED';

export type ContinuityState =
  | 'ACTIVE'
  | 'PAUSED_BY_USER'
  | 'INTERRUPTED_BY_USER'
  | 'BACKGROUNDED'
  | 'WAITING_FOR_RECONCILIATION'
  | 'READY_TO_RESUME'
  | 'COMPLETED'
  | 'STOPPED'
  | 'FAILED';

export type IntentType =
  | 'NORMAL_CONVERSATION'
  | 'INFORMATION_REQUEST'
  | 'SCREEN_QUESTION'
  | 'TASK_REQUEST'
  | 'AUTOMATION_REQUEST'
  | 'CONTROL_COMMAND'
  | 'TASK_CORRECTION'
  | 'TASK_CANCEL';

export type ControlActionType =
  | 'PAUSE'
  | 'RESUME'
  | 'STOP'
  | 'CANCEL'
  | 'RESTART'
  | 'CONTINUE_PREVIOUS'
  | 'WHAT_ARE_YOU_DOING'
  | 'WHAT_HAVE_YOU_DONE';

export type TargetSource =
  | 'ACCESSIBILITY_ID'
  | 'TEXT'
  | 'CONTENT_DESCRIPTION'
  | 'HIERARCHY'
  | 'SEMANTIC_MATCH'
  | 'VISION'
  | 'COORDINATE_FALLBACK';

export interface RectBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface UiNode {
  id: string;
  resourceId?: string;
  className?: string;
  packageName?: string;
  text?: string;
  contentDescription?: string;
  bounds: RectBounds;
  isClickable: boolean;
  isEditable: boolean;
  isScrollable: boolean;
  isFocused: boolean;
  isVisible: boolean;
  children?: UiNode[];
}

export interface PopupState {
  detected: boolean;
  type: 'permission' | 'cookie' | 'login' | 'ad' | 'system_dialog' | 'unknown';
  title?: string;
  dismissButtonId?: string;
  message?: string;
}

export interface UnifiedScreenState {
  packageName: string;
  activityName?: string;
  width: number;
  height: number;
  nodes: UiNode[];
  visibleTexts: string[];
  clickableElements: UiNode[];
  editableElements: UiNode[];
  scrollableElements: UiNode[];
  popups: PopupState[];
  loading: boolean;
  fingerprint: string;
  timestamp: number;
  screenshotBase64?: string;
}

export interface TargetIdentity {
  semanticDescription: string;
  resourceId?: string;
  text?: string;
  contentDescription?: string;
  bounds?: RectBounds;
  confidence: number;
  source: TargetSource;
}

export interface TaskStep {
  id: string;
  title: string;
  actionType:
    | 'open_app'
    | 'click'
    | 'long_click'
    | 'type_text'
    | 'clear_text'
    | 'scroll_down'
    | 'scroll_up'
    | 'press_key'
    | 'wait'
    | 'back'
    | 'home'
    | 'verify_target'
    | 'browser_navigate'
    | 'browser_search'
    | 'custom';
  targetDescription?: string;
  targetIdentity?: TargetIdentity;
  params?: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  expectedOutcome: string;
  actualOutcome?: string;
  retryCount: number;
}

export interface RecoveryEvent {
  timestamp: number;
  trigger: string;
  strategy: string;
  success: boolean;
  details?: string;
}

export interface PersistedTaskSnapshot {
  taskId: string;
  conversationId?: string;
  originalGoal: string;
  normalizedIntent?: string;
  plan: TaskStep[];
  currentStepIndex: number;
  completedSteps: string[];
  currentState: AgentState;
  continuityState: ContinuityState;
  lastKnownPackage?: string;
  lastKnownActivity?: string;
  lastScreenFingerprint?: string;
  lastObservationTimestamp?: number;
  pauseReason?: string;
  interruptionReason?: string;
  retryCounts: Record<string, number>;
  recoveryHistory: RecoveryEvent[];
  userCorrections: string[];
  createdAt: number;
  updatedAt: number;
}

export type TaskEventType =
  | 'TASK_RECEIVED'
  | 'GOAL_UNDERSTOOD'
  | 'PLAN_CREATED'
  | 'SCREEN_INSPECTED'
  | 'STEP_STARTED'
  | 'ACTION_EXECUTED'
  | 'OBSERVATION_COMPLETED'
  | 'VERIFICATION_PASSED'
  | 'VERIFICATION_FAILED'
  | 'PAUSED'
  | 'RESUMED'
  | 'INTERRUPTED'
  | 'BACKGROUNDED'
  | 'RECONCILED'
  | 'RECOVERED'
  | 'USER_CORRECTION'
  | 'COMPLETED'
  | 'STOPPED'
  | 'FAILED';

export interface TaskEvent {
  timestamp: number;
  type: TaskEventType;
  message: string;
  stepId?: string;
  success?: boolean;
}

export interface ToolResult {
  success: boolean;
  toolName: string;
  message: string;
  stateChanged: boolean;
  errorType?: string;
  retryable: boolean;
  screenshotRecommended: boolean;
  data?: any;
}

export interface AgentPermissionState {
  accessibilityEnabled: boolean;
  screenCaptureAvailable: boolean;
  notificationPermission: boolean;
  microphonePermission: boolean;
  requiredPermissionsMissing: string[];
}

export interface ConversationContext {
  conversationId: string;
  activeTaskId?: string;
  lastUserMessage: string;
  recentMessages: Array<{ role: string; content: string; timestamp: number }>;
  currentIntent: IntentType;
  taskStatus: AgentState;
}
