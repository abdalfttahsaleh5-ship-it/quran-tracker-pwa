"use client";

import { useEffect } from "react";
import { BeforeInstallPromptEvent } from "@/types/pwa";

/**
 * Centralized PWA Provider:
 * 1. Registers service worker (/sw.js)
 * 2. Captures beforeinstallprompt once globally and stores it on window.deferredPwaPrompt
 * 3. Dispatches 'pwa-prompt-ready' event for UI components
 */
export function PWAProvider() {
  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Graceful fallback
        });
      };

      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
      }
    }

    // 2. Global beforeinstallprompt Capture
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.deferredPwaPrompt = promptEvent;
      window.dispatchEvent(new CustomEvent("pwa-prompt-ready"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
