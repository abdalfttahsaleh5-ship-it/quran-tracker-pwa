"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showRestored) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 p-2.5 text-center text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
        isOffline
          ? "bg-amber-600 text-white"
          : "bg-emerald-600 text-white"
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>أنت تعمل حالياً دون اتصال بالإنترنت - يتم حفظ التغييرات محلياً</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 shrink-0" />
          <span>تم استعادة الاتصال بالإنترنت بنجاح</span>
        </>
      )}
    </div>
  );
}
