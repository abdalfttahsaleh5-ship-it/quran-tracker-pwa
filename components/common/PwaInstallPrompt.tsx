"use client";

import { useState, useEffect } from "react";
import { Download, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-40 bg-gradient-to-r from-teal-900 to-teal-800 text-white p-4 rounded-2xl shadow-2xl border border-teal-600 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-teal-200" />
        </div>
        <div>
          <h4 className="text-sm font-bold">تثبيت تطبيق متابع الحفظ</h4>
          <p className="text-xs text-teal-200">أضف التطبيق للشاشة الرئيسية للوصول السريع</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstallClick}
          className="gap-1 text-xs font-bold shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تثبيت</span>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 text-teal-200 hover:text-white rounded-lg"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
