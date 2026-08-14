"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const CHUNK_RELOAD_KEY = "quran_tracker_chunk_reloaded";

function isChunkError(error: Error | null): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const name = (error.name || "").toLowerCase();
  return (
    name.includes("chunkloaderror") ||
    msg.includes("loading chunk") ||
    msg.includes("chunkloaderror") ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("failed to load script")
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Clear chunk reload guard once healthy mount succeeds
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Auto-detect chunk loading failure and reload safely once
    if (typeof window !== "undefined" && isChunkError(error)) {
      const hasReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!hasReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "true");
        window.location.reload();
        return;
      }
    }
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      window.location.reload();
    }
  };

  handleReset = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-rose-200 dark:border-rose-900/50">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50">
                عذراً، حدث خطأ غير متوقع أثناء معالجة البيانات ⚠️
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                {this.state.error?.message || "تعذر إكمال العملية، يرجى إعادة تحميل الصفحة أو المحاولة لاحقاً"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={this.handleReload}
                className="w-full sm:flex-1 gap-2 h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الصفحة 🔄</span>
              </Button>

              <Button
                variant="outline"
                onClick={this.handleReset}
                className="w-full sm:w-auto gap-1.5 h-11 rounded-xl border-slate-200 dark:border-slate-800"
              >
                <span>محاولة أخرى</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
