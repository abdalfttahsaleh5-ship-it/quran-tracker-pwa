"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPendingActionsCount,
  syncPendingActions,
  setActiveUserId,
} from "@/lib/offlineQueue";
import { createClient } from "@/lib/supabase/client";

export interface NetworkSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  manualSync: () => Promise<{ syncedCount: number; failedCount: number }>;
}

export function useNetworkSync(): NetworkSyncState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const updateQueueCount = useCallback((uid?: string | null) => {
    const targetUid = uid !== undefined ? uid : userIdRef.current;
    if (targetUid) {
      setPendingCount(getPendingActionsCount(targetUid));
    } else {
      setPendingCount(0);
    }
  }, []);

  const manualSync = useCallback(async () => {
    const currentUid = userIdRef.current;
    if (typeof window === "undefined" || !navigator.onLine || !currentUid) {
      return { syncedCount: 0, failedCount: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingActions(currentUid);
      updateQueueCount(currentUid);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [updateQueueCount]);

  // Handle Supabase Auth lifecycle and active user ID resolution
  useEffect(() => {
    if (typeof window === "undefined") return;

    const supabase = createClient();

    // 1. Initial auth user retrieval
    supabase.auth.getUser().then(({ data }) => {
      const activeId = data.user?.id || null;
      setUserId(activeId);
      setActiveUserId(activeId);
      updateQueueCount(activeId);
      if (activeId && navigator.onLine && getPendingActionsCount(activeId) > 0) {
        manualSync();
      }
    });

    // 2. Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUserId(null);
        setActiveUserId(null);
        setPendingCount(0);
        setIsSyncing(false);
      } else if (session?.user?.id) {
        const newUid = session.user.id;
        setUserId(newUid);
        setActiveUserId(newUid);
        updateQueueCount(newUid);
        if (navigator.onLine && getPendingActionsCount(newUid) > 0) {
          manualSync();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [manualSync, updateQueueCount]);

  // Handle network online/offline and visibility transitions
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      manualSync();
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        manualSync();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-changed", handleQueueChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-changed", handleQueueChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [manualSync, updateQueueCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    manualSync,
  };
}
