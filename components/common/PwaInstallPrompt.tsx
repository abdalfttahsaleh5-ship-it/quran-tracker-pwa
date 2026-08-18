"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  X,
  Download,
  CheckCircle2,
  Share2,
  PlusSquare,
  MoreVertical,
  ArrowDownCircle,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { lightHaptic, successHaptic } from "@/lib/haptics";
import { BeforeInstallPromptEvent } from "@/types/pwa";

const PWA_DISMISS_SESSION_KEY = "quran_tracker_pwa_install_dismissed";

type InstallView = "prompt" | "instructions" | "success";

/**
 * Unified PWA Installation Modal & Prompt.
 * Guarantees native 1-click install when available, and provides graceful visual instructions when not.
 */
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [view, setView] = useState<InstallView>("prompt");

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

    // Initial check for deferredPrompt
    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
    }

    // Listener for prompt ready from PWAProvider or head script
    const handlePromptReady = () => {
      if (window.deferredPwaPrompt) {
        setDeferredPrompt(window.deferredPwaPrompt);
      }
    };
    window.addEventListener("pwa-prompt-ready", handlePromptReady);

    // Global event listener to manually open this modal from Header or any button
    const handleManualOpen = () => {
      setView("prompt");
      setIsOpen(true);
    };
    window.addEventListener("open-pwa-install-modal", handleManualOpen);

    // Auto-display modal once per session after delay if not dismissed
    const isDismissed = sessionStorage.getItem(PWA_DISMISS_SESSION_KEY);
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("pwa-prompt-ready", handlePromptReady);
        window.removeEventListener("open-pwa-install-modal", handleManualOpen);
      };
    }

    return () => {
      window.removeEventListener("pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("open-pwa-install-modal", handleManualOpen);
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
          setView("success");
          setTimeout(() => {
            setIsOpen(false);
            setView("prompt");
          }, 2500);
        } else {
          // User cancelled prompt
          setView("instructions");
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setView("instructions");
      }
      window.deferredPwaPrompt = null;
      setDeferredPrompt(null);
    } else {
      // If deferredPrompt is NULL, switch to manual instructions view gracefully
      setView("instructions");
    }
  };

  const handleClose = () => {
    lightHaptic();
    setIsOpen(false);
    setView("prompt");
    sessionStorage.setItem(PWA_DISMISS_SESSION_KEY, "true");
  };

  if (isStandalone || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top App Identity */}
        <div className="flex items-center gap-3.5 pr-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-700 text-white flex items-center justify-center font-bold shadow-lg shrink-0">
            <BookOpen className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 leading-tight">
              تثبيت تطبيق متابع الحفظ
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              مسجد حذيفة بن اليمان - حلقة القرآن الكريم
            </p>
          </div>
        </div>

        {/* 1. Success State */}
        {view === "success" ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2.5 animate-in zoom-in-90 duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
            <p className="font-black text-base text-emerald-900 dark:text-emerald-200">
              تم تثبيت التطبيق بنجاح! 🚀
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              يمكنك الآن فتح التطبيق مباشرة من شاشتك الرئيسية في أي وقت.
            </p>
          </div>
        ) : isIOS || view === "instructions" ? (
          /* 2. Step-by-Step Visual Instructions (iOS or Manual Browser Fallback) */
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              {isIOS
                ? "لتثبيت التطبيق على جهاز iPhone أو iPad عبر متصفح Safari:"
                : "لتثبيت التطبيق يدوياً عبر قائمة المتصفح:"}
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
              {isIOS ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <span>
                      1. اضغط على زر <strong>المشاركة (Share)</strong> في أسفل شريط Safari.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black shrink-0">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <span>
                      2. مرر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </div>
                    <span>
                      1. اضغط على <strong>قائمة المتصفح (⋮)</strong> في أعلى أو أسفل الشاشة.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black shrink-0">
                      <ArrowDownCircle className="w-4 h-4" />
                    </div>
                    <span>
                      2. اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.
                    </span>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleClose}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md text-xs"
            >
              حسناً، فهمت ذلك 👍
            </Button>
          </div>
        ) : (
          /* 3. Primary 1-Click Install View (Android / Chrome / Desktop) */
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold">✨ مميزات التثبيت:</p>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-800 dark:text-emerald-300">
                <li>العمل دون اتصال بالإنترنت وحفظ السجلات محلياً</li>
                <li>تصفح سريع جداً بدون شريط المتصفح</li>
                <li>وصول مباشر من الشاشة الرئيسية بلمسة واحدة</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md text-xs gap-2"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>تثبيت التطبيق الآن 📲</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="py-3 px-4 rounded-xl text-xs font-bold text-slate-500"
              >
                لاحقاً
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Backward compatibility alias
export const PWAInstallModal = PwaInstallPrompt;
