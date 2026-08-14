import { createMemorizationLog } from "@/lib/actions/log";
import { recordAttendance, recordBulkAttendance } from "@/lib/actions/attendance";
import { successHaptic } from "@/lib/haptics";

export type QueuedActionType = "attendance" | "recitation";

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: any;
  createdAt: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = "quran_tracker_offline_queue_v1";

/**
 * Returns all currently queued pending actions from localStorage.
 */
export function getPendingActions(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading offline queue from localStorage:", err);
    return [];
  }
}

/**
 * Returns the count of pending offline actions.
 */
export function getPendingActionsCount(): number {
  return getPendingActions().length;
}

/**
 * Dispatches a custom window event to notify UI components of queue changes.
 */
function notifyQueueChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("offline-queue-changed", {
      detail: { count: getPendingActionsCount() }
    }));
  }
}

/**
 * Enqueues a pending action for offline storage.
 */
export function queuePendingAction(type: QueuedActionType, payload: any): QueuedAction {
  const actions = getPendingActions();
  const newAction: QueuedAction = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  };

  const updated = [...actions, newAction];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to write to localStorage offline queue:", e);
    }
  }

  notifyQueueChange();
  return newAction;
}

/**
 * Removes a specific pending action by ID.
 */
export function removePendingAction(id: string): void {
  const actions = getPendingActions();
  const filtered = actions.filter((a) => a.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to update localStorage offline queue:", e);
    }
  }
  notifyQueueChange();
}

/**
 * Clears all pending offline actions.
 */
export function clearPendingActions(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
  notifyQueueChange();
}

let isSyncInProgress = false;

/**
 * Iterates over all pending actions in the queue and syncs them to the backend.
 */
export async function syncPendingActions(): Promise<{ syncedCount: number; failedCount: number }> {
  if (typeof window === "undefined" || !navigator.onLine || isSyncInProgress) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const actions = getPendingActions();
  if (actions.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  isSyncInProgress = true;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    for (const action of actions) {
      try {
        let isSuccess = false;

        if (action.type === "recitation") {
          const res = await createMemorizationLog(action.payload);
          isSuccess = Boolean(res && res.success);
        } else if (action.type === "attendance") {
          if (Array.isArray(action.payload)) {
            const res = await recordBulkAttendance(action.payload);
            isSuccess = Boolean(res && res.success);
          } else {
            const res = await recordAttendance(action.payload);
            isSuccess = Boolean(res && res.success);
          }
        }

        if (isSuccess) {
          removePendingAction(action.id);
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error(`Failed syncing action ${action.id}:`, err);
        failedCount++;
      }
    }

    if (syncedCount > 0) {
      successHaptic();
      window.dispatchEvent(
        new CustomEvent("offline-sync-success", {
          detail: { syncedCount, remaining: getPendingActionsCount() },
        })
      );
    }
  } finally {
    isSyncInProgress = false;
  }

  return { syncedCount, failedCount };
}
