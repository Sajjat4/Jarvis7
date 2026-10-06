/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PersistedTaskSnapshot, TaskEvent } from './types';

const ACTIVE_TASK_KEY = 'myra_active_task_snapshot_v1';
const TASK_TIMELINE_KEY_PREFIX = 'myra_task_timeline_';
const TASK_HISTORY_KEY = 'myra_task_history_v1';

export class TaskPersistenceStore {
  public static saveSnapshot(snapshot: PersistedTaskSnapshot): void {
    try {
      const updated: PersistedTaskSnapshot = {
        ...snapshot,
        updatedAt: Date.now(),
      };
      localStorage.setItem(ACTIVE_TASK_KEY, JSON.stringify(updated));

      // Also append or update in task history
      this.updateHistory(updated);
    } catch (e) {
      console.warn('Failed to persist task snapshot:', e);
    }
  }

  public static loadActiveSnapshot(): PersistedTaskSnapshot | null {
    try {
      const raw = localStorage.getItem(ACTIVE_TASK_KEY);
      if (!raw) return null;
      const parsed: PersistedTaskSnapshot = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.warn('Failed to load active task snapshot:', e);
      return null;
    }
  }

  public static clearActiveSnapshot(): void {
    try {
      localStorage.removeItem(ACTIVE_TASK_KEY);
    } catch (e) {
      console.warn('Failed to clear active task snapshot:', e);
    }
  }

  public static appendTimelineEvent(taskId: string, event: TaskEvent): void {
    try {
      const key = `${TASK_TIMELINE_KEY_PREFIX}${taskId}`;
      const raw = localStorage.getItem(key);
      const list: TaskEvent[] = raw ? JSON.parse(raw) : [];
      list.push(event);
      localStorage.setItem(key, JSON.stringify(list.slice(-100)));
    } catch (e) {
      console.warn('Failed to append timeline event:', e);
    }
  }

  public static getTimeline(taskId: string): TaskEvent[] {
    try {
      const key = `${TASK_TIMELINE_KEY_PREFIX}${taskId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public static getTaskHistory(): PersistedTaskSnapshot[] {
    try {
      const raw = localStorage.getItem(TASK_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  private static updateHistory(snapshot: PersistedTaskSnapshot): void {
    try {
      const raw = localStorage.getItem(TASK_HISTORY_KEY);
      const history: PersistedTaskSnapshot[] = raw ? JSON.parse(raw) : [];
      const idx = history.findIndex((h) => h.taskId === snapshot.taskId);
      if (idx !== -1) {
        history[idx] = snapshot;
      } else {
        history.unshift(snapshot);
      }
      localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    } catch (e) {}
  }
}
