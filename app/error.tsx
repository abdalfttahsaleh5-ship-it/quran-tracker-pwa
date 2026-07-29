"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error("App Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-900/50">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">
            حدث خطأ غير متوقع أثناء معالجة الطلب
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            {error.message || "حدث خطأ في النظام، يرجى المحاولة مرة أخرى أو العودة للرئيسية"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={() => reset()} className="flex-1 gap-2 h-11">
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </Button>

          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2 h-11">
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
