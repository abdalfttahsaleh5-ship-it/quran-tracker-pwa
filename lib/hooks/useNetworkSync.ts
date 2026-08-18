"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPendingActionsCount,
  flush,
  setActiveUserId,
  getActiveUserIdSync,
} from "@/lib/offlineQueue";
import { createClient } from "@/lib/supabase/client";

export interface NetworkSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  manualSync: () => Promise<{ syncedCount: number; failedCount: number }>;
}

/**
 * React hook exposing reactive network connectivity and pending offline queue metrics.
 */
export function useNetworkSync(): NetworkSyncState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const userIdRef = useRef<string | null>(null);

  const updateQueueCount = useCallback((uid?: string | null) => {
    const targetUid = uid !== undefined ? uid : userIdRef.current || getActiveUserIdSync();
    if (targetUid) {
      setPendingCount(getPendingActionsCount(targetUid));
    } else {
      setPendingCount(0);
    }
  }, []);

  const manualSync = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) {
      return { syncedCount: 0, failedCount: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await flush(userIdRef.current);
      updateQueueCount(userIdRef.current);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [updateQueueCount]);

  // Handle Supabase Auth lifecycle & reactive state
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    const supabase = createClient();

    // 1. Initial auth user retrieval
    supabase.auth.getUser().then(({ data }) => {
      const activeId = data.user?.id || null;
      userIdRef.current = activeId;
      setActiveUserId(activeId);
      updateQueueCount(activeId);
      if (activeId && navigator.onLine && getPendingActionsCount(activeId) > 0) {
        manualSync();
      }
    });

    // 2. Auth state change transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUid = session?.user?.id || null;
      userIdRef.current = newUid;
      setActiveUserId(newUid);
      updateQueueCount(newUid);
      if (newUid && navigator.onLine && getPendingActionsCount(newUid) > 0) {
        manualSync();
      }
    });

    // 3. Network & queue event subscriptions
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateQueueCount();
    };

    const handleQueueChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.userId || detail.userId === userIdRef.current) {
        updateQueueCount(userIdRef.current);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-changed", handleQueueChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-changed", handleQueueChange);
    };
  }, [manualSync, updateQueueCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    manualSync,
  };
}
