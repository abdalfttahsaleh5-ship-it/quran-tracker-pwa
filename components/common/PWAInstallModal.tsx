"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Sparkles, Share2, PlusSquare, X, Download, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lightHaptic, successHaptic } from "@/lib/haptics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWA_DISMISS_SESSION_KEY = "quran_tracker_pwa_install_dismissed";

export function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const isAppStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem(PWA_DISMISS_SESSION_KEY);
    if (isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show for iOS users after a gentle 2.5s delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome: listen to beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Reveal prompt after 1.5s
      setTimeout(() => {
        setIsOpen(true);
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    lightHaptic();
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      successHaptic();
      setIsOpen(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    lightHaptic();
    setIsOpen(false);
    sessionStorage.setItem(PWA_DISMISS_SESSION_KEY, "true");
  };

  if (isStandalone || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-slate-200/80 dark:border-slate-800 space-y-5 animate-in slide-in-from-bottom-6 duration-300">
        {/* App Emblem & Title Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-950 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-500/30 shrink-0">
              <BookOpen className="w-7 h-7 text-amber-300" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                تطبيق متابع الحفظ 📱
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                حلقات مسجد حذيفة بن اليمان - طبربور
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-black text-amber-500">⭐⭐⭐⭐⭐</span>
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.2 rounded-md">
                  النسخة الرسمية
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="text-base">⚡</span>
            <span>وصول فوري بلمسة واحدة من شاشتك الرئيسية</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="text-base">🎙️</span>
            <span>استماع لتلاوات الطلاب وتسجيل الملاحظات الصوتية</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="text-base">📴</span>
            <span>تجربة تطبيق أصلية كاملة دون الحاجة لمتصفح</span>
          </div>
        </div>

        {/* Platform Specific Action Cards */}
        {isIOS ? (
          /* iOS Step-by-Step Instructions */
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
            <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>طريقة التثبيت على أجهزة آيفون (iOS Safari):</span>
            </h4>

            <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[11px] font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  اضغط على زر المشاركة السفلي في المتصفح{" "}
                  <Share2 className="w-4 h-4 inline-block text-emerald-700 dark:text-emerald-400 mx-1 align-text-bottom" />
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[11px] font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  مرر للأسفل واختر{" "}
                  <strong className="text-emerald-800 dark:text-emerald-300">
                    &quot;إضافة إلى الشاشة الرئيسية&quot;
                  </strong>{" "}
                  <PlusSquare className="w-4 h-4 inline-block text-emerald-700 dark:text-emerald-400 mx-1 align-text-bottom" />
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome Native Install Button */
          <Button
            onClick={handleInstallClick}
            className="w-full py-4 h-auto bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-800/20 gap-2 transition-all"
          >
            <Download className="w-5 h-5" />
            <span>تثبيت التطبيق الآن 📲</span>
          </Button>
        )}

        {/* Footer Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-center"
        >
          المتابعة في المتصفح (لاحقاً)
        </button>
      </div>
    </div>
  );
}
