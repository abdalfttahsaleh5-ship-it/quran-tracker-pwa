import { createMemorizationLog } from "@/lib/actions/log";
import { recordAttendance, recordBulkAttendance } from "@/lib/actions/attendance";
import { successHaptic } from "@/lib/haptics";
import { createClient } from "@/lib/supabase/client";

export type QueuedActionType = "attendance" | "recitation";

export interface QueuedAction {
  id: string; // Deterministic UUID client_id
  userId: string;
  type: QueuedActionType;
  payload: any;
  createdAt: number;
  retryCount: number;
}

/**
 * Returns dynamic user-scoped queue key to isolate data per authenticated user.
 */
export const getQueueKey = (userId: string): string => {
  return `quran_tracker_queue_${userId}_v1`;
};

// In-memory track of active user ID for synchronous fallback
let currentActiveUserId: string | null = null;

export function setActiveUserId(userId: string | null): void {
  currentActiveUserId = userId;
}

export function getActiveUserIdSync(): string | null {
  return currentActiveUserId || tryGetCachedUserId();
}

/**
 * Attempts to synchronously extract active user ID from Supabase auth storage if available.
 */
function tryGetCachedUserId(): string | null {
  if (currentActiveUserId) return currentActiveUserId;
  if (typeof window === "undefined") return null;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          const uid = parsed?.user?.id || parsed?.id;
          if (uid && typeof uid === "string") {
            currentActiveUserId = uid;
            return uid;
          }
        }
      }
    }
  } catch {
    // Ignore storage parsing errors
  }
  return null;
}

/**
 * Asynchronously gets the current authenticated user ID from Supabase.
 */
export async function getActiveUserId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      currentActiveUserId = user.id;
      return user.id;
    }
    return currentActiveUserId || tryGetCachedUserId();
  } catch (err) {
    console.error("Error retrieving active user ID from Supabase:", err);
    return currentActiveUserId || tryGetCachedUserId();
  }
}

/**
 * Returns all currently queued pending actions for a specific user from localStorage.
 */
export function getPendingActions(userId?: string | null): QueuedAction[] {
  if (typeof window === "undefined") return [];
  const uid = userId || currentActiveUserId || tryGetCachedUserId();
  if (!uid) return [];

  try {
    const raw = localStorage.getItem(getQueueKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Strict isolation check: enforce that every returned action matches the requested user ID
    return parsed.filter((a: QueuedAction) => a && a.userId === uid);
  } catch (err) {
    console.error(`Error reading offline queue for user ${uid}:`, err);
    return [];
  }
}

/**
 * Returns the count of pending offline actions for a specific user.
 */
export function getPendingActionsCount(userId?: string | null): number {
  const uid = userId || currentActiveUserId || tryGetCachedUserId();
  if (!uid) return 0;
  return getPendingActions(uid).length;
}

/**
 * Dispatches a custom window event to notify UI components of queue changes for a user.
 */
export function notifyQueueChange(userId?: string | null): void {
  if (typeof window !== "undefined") {
    const uid = userId || currentActiveUserId || tryGetCachedUserId();
    window.dispatchEvent(
      new CustomEvent("offline-queue-changed", {
        detail: {
          userId: uid || null,
          count: uid ? getPendingActionsCount(uid) : 0,
        },
      })
    );
  }
}

/**
 * Enqueues a pending action into the user-specific offline queue with deterministic UUID client_id.
 */
export function enqueueAction(
  type: QueuedActionType,
  payload: any,
  userId?: string | null
): QueuedAction | null {
  const uid = userId || currentActiveUserId || tryGetCachedUserId();
  if (!uid) {
    console.error("enqueueAction failed: active user_id is required to queue offline actions.");
    return null;
  }

  const actionId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Attach deterministic client_id for idempotent server processing
  const payloadWithClientId =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...payload, client_id: actionId }
      : payload;

  const actions = getPendingActions(uid);
  const newAction: QueuedAction = {
    id: actionId,
    userId: uid,
    type,
    payload: payloadWithClientId,
    createdAt: Date.now(),
    retryCount: 0,
  };

  const updated = [...actions, newAction];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getQueueKey(uid), JSON.stringify(updated));
    } catch (e) {
      console.error(`Failed to write to localStorage offline queue for user ${uid}:`, e);
    }
  }

  notifyQueueChange(uid);
  return newAction;
}

// Alias for backwards compatibility
export const queuePendingAction = enqueueAction;

/**
 * Removes a specific pending action by ID from the user-specific queue.
 */
export function removePendingAction(id: string, userId?: string | null): void {
  const uid = userId || currentActiveUserId || tryGetCachedUserId();
  if (!uid) return;

  const actions = getPendingActions(uid);
  const filtered = actions.filter((a) => a.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getQueueKey(uid), JSON.stringify(filtered));
    } catch (e) {
      console.error(`Failed to update localStorage offline queue for user ${uid}:`, e);
    }
  }
  notifyQueueChange(uid);
}

/**
 * Clears all pending offline actions for a specific user.
 */
export function clearUserQueue(userId?: string | null): void {
  const uid = userId || currentActiveUserId || tryGetCachedUserId();
  if (typeof window !== "undefined" && uid) {
    localStorage.removeItem(getQueueKey(uid));
    notifyQueueChange(uid);
  }
}

export const clearPendingActions = clearUserQueue;

let isSyncInProgress = false;

/**
 * Synchronizes all pending actions in the user's specific queue to the backend.
 * Guarantees single-flight processing to avoid double mutations.
 */
export async function flush(
  userId?: string | null
): Promise<{ syncedCount: number; failedCount: number }> {
  if (typeof window === "undefined" || !navigator.onLine || isSyncInProgress) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let uid = userId || currentActiveUserId || tryGetCachedUserId();
  if (!uid) {
    uid = await getActiveUserId();
  }

  if (!uid) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const actions = getPendingActions(uid);
  if (actions.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  isSyncInProgress = true;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    for (const action of actions) {
      // Security check: ensure action strictly belongs to active user
      if (action.userId !== uid) {
        console.warn(`Skipping action ${action.id}: user mismatch (${action.userId} !== ${uid})`);
        continue;
      }

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
          removePendingAction(action.id, uid);
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error(`Failed syncing action ${action.id} for user ${uid}:`, err);
        failedCount++;
      }
    }

    if (syncedCount > 0) {
      successHaptic();
      window.dispatchEvent(
        new CustomEvent("offline-sync-success", {
          detail: { userId: uid, syncedCount, remaining: getPendingActionsCount(uid) },
        })
      );
    }
  } finally {
    isSyncInProgress = false;
  }

  return { syncedCount, failedCount };
}

// Backward compatibility alias
export const syncPendingActions = flush;

// Debounced flush trigger
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedFlush(delayMs: number = 300): void {
  if (typeof window === "undefined" || !navigator.onLine) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    flush();
  }, delayMs);
}

// Automatically bind network and visibility listeners to trigger debounced flush
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    debouncedFlush(200);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      debouncedFlush(300);
    }
  });
}
