"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNetworkSync } from "@/lib/hooks/useNetworkSync";
import { lightHaptic } from "@/lib/haptics";

export function OfflineStatusBanner() {
  const { isOnline, pendingCount, isSyncing, manualSync } = useNetworkSync();
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  useEffect(() => {
    const handleSyncSuccess = (e: Event) => {
      const customEvent = e as CustomEvent<{ syncedCount: number; remaining: number }>;
      if (customEvent.detail && customEvent.detail.syncedCount > 0) {
        setLastSyncResult(`تمت مزامنة ${customEvent.detail.syncedCount} سجل بنجاح ✨`);
        setShowRestoredNotice(true);
        const timer = setTimeout(() => {
          setShowRestoredNotice(false);
          setLastSyncResult(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("offline-sync-success", handleSyncSuccess);
    return () => {
      window.removeEventListener("offline-sync-success", handleSyncSuccess);
    };
  }, []);

  // When coming back online without pending items
  useEffect(() => {
    if (isOnline && pendingCount === 0 && !isSyncing) {
      // Don't keep showing restored banner forever
    }
  }, [isOnline, pendingCount, isSyncing]);

  if (isOnline && pendingCount === 0 && !isSyncing && !showRestoredNotice) {
    return null;
  }

  const handleManualSyncClick = async () => {
    lightHaptic();
    await manualSync();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[100] px-4 py-2 text-center text-xs font-bold transition-all shadow-md flex items-center justify-between gap-3 no-print print:hidden ${
        !isOnline
          ? "bg-amber-600 dark:bg-amber-700 text-white"
          : isSyncing
          ? "bg-teal-700 dark:bg-teal-800 text-white animate-pulse"
          : pendingCount > 0
          ? "bg-amber-500 text-amber-950"
          : "bg-emerald-600 text-white"
      }`}
    >
      <div className="flex items-center gap-2 flex-1 justify-center">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-100" />
            <span>
              📡 أنت تعمل بدون اتصال بالإنترنت • سيتم حفظ البيانات ومزامنتها تلقائياً عند عودة الشبكة
              {pendingCount > 0 && ` (${pendingCount} سجل معلق)`}
            </span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-teal-200" />
            <span>جارٍ مزامنة السجلات المعلقة ({pendingCount}) مع قاعدة البيانات...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-900" />
            <span>يوجد {pendingCount} سجل تم حفظه محلياً بانتظار المزامنة</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{lastSyncResult || "تم استعادة الاتصال بالإنترنت والمزامنة بنجاح"}</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          type="button"
          onClick={handleManualSyncClick}
          className="bg-amber-950/20 hover:bg-amber-950/30 text-amber-950 px-3 py-1 rounded-lg border border-amber-900/30 text-[11px] font-black transition-all flex items-center gap-1 shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          <span>مزامنة الآن</span>
        </button>
      )}
    </div>
  );
}
