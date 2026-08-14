"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingActionsCount, syncPendingActions } from "@/lib/offlineQueue";

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

  const updateQueueCount = useCallback(() => {
    setPendingCount(getPendingActionsCount());
  }, []);

  const manualSync = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) {
      return { syncedCount: 0, failedCount: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingActions();
      updateQueueCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [updateQueueCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      manualSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateQueueCount();
    };

    const handleQueueChange = () => {
      updateQueueCount();
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

    // Initial check: if online and has pending items, sync immediately
    if (navigator.onLine && getPendingActionsCount() > 0) {
      manualSync();
    }

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
