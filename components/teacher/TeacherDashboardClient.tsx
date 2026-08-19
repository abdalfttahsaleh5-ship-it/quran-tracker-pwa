"use client";

import { Sparkles } from "lucide-react";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";

export function TeacherDashboardClient() {
  const { notification } = useRealtimeSync();

  return (
    <>
      {notification && (
        <div className="p-3 bg-teal-800 text-white font-bold text-xs rounded-xl shadow-lg animate-in slide-in-from-top duration-300 flex items-center justify-center gap-2 mb-3">
          <span>{notification}</span>
        </div>
      )}

      {/* Compact Hero Banner */}
      <div className="hero-banner no-print print:hidden relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-emerald-800/40">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/60 border border-emerald-700/60 text-amber-300 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>مساعد معلم القرآن الكريم</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              أهلاً بك، معلم الحلقة 📜
            </h1>
            <p className="text-emerald-200/80 text-xs font-medium">
              متابعة دقيقة للحفظ والمراجعة والحضور اليومي
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
