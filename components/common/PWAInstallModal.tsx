"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, X, Download, CheckCircle2, Share2, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lightHaptic, successHaptic } from "@/lib/haptics";

import { BeforeInstallPromptEvent } from "@/types/pwa";

const PWA_DISMISS_SESSION_KEY = "quran_tracker_pwa_install_dismissed";

export function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const isAppStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Global event listener to manually open this modal from Header or any button
    const handleManualOpen = () => {
      setShowIOSHint(false);
      setIsOpen(true);
    };

    window.addEventListener("open-pwa-install-modal", handleManualOpen);

    // Check if dismissed in this session for auto-popup
    const isDismissed = sessionStorage.getItem(PWA_DISMISS_SESSION_KEY);

    if (!isDismissed) {
      if (isIosDevice) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000);
        return () => {
          clearTimeout(timer);
          window.removeEventListener("open-pwa-install-modal", handleManualOpen);
        };
      }
    }

    // For Android/Chrome: capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      window.deferredPwaPrompt = promptEvent;

      if (!isDismissed) {
        setTimeout(() => {
          setIsOpen(true);
        }, 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("open-pwa-install-modal", handleManualOpen);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    lightHaptic();
    const prompt =
      deferredPrompt ||
      (typeof window !== "undefined" ? window.deferredPwaPrompt : null);

    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;

        if (choice.outcome === "accepted") {
          successHaptic();
          setInstalledSuccess(true);
          setTimeout(() => {
            setIsOpen(false);
            setInstalledSuccess(false);
          }, 2000);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
      setDeferredPrompt(null);
      window.deferredPwaPrompt = null;
    } else if (isIOS) {
      // Graceful fallback toggle for iOS
      setShowIOSHint(true);
    } else {
      setShowIOSHint(true);
    }
  };

  const handleDismiss = () => {
    lightHaptic();
    setIsOpen(false);
    setShowIOSHint(false);
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
                  النسخة الرسمية للمسجد
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

        {/* Feature Highlights */}
        <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-base">⚡</span>
            <span>وصول فوري وسريع من الشاشة الرئيسية</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-base">🎙️</span>
            <span>استماع لتلاوات الطلاب وتسجيل التسميع</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-base">📴</span>
            <span>يعمل بسلاسة كتطبيق أصلي دون الحاجة لمتصفح</span>
          </div>
        </div>

        {/* Success Toast State */}
        {installedSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center justify-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم تثبيت التطبيق بنجاح 🎉</span>
          </div>
        )}

        {/* Graceful iOS / Browser Hint (Only if prompted and prompt was blocked) */}
        {showIOSHint && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200 space-y-1.5 animate-in fade-in">
            <p className="flex items-center gap-1.5 font-black">
              <span>للإضافة للشاشة الرئيسية:</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              اضغط على زر المشاركة{" "}
              <Share2 className="w-3.5 h-3.5 inline text-emerald-700 mx-0.5 align-text-bottom" /> ثم اختر{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">&quot;إضافة إلى الشاشة الرئيسية ➕&quot;</strong>
            </p>
          </div>
        )}

        {/* Single Full-Width Primary Action Button */}
        <Button
          type="button"
          onClick={handleInstallClick}
          className="w-full py-4 h-auto bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-800/20 gap-2 transition-all flex items-center justify-center"
        >
          <Download className="w-5 h-5" />
          <span>تثبيت التطبيق على الهاتف الآن 📲</span>
        </Button>

        {/* Footer Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-center"
        >
          المتابعة في المتصفح (إغلاق)
        </button>
      </div>
    </div>
  );
}
