"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Zap, CheckCircle2, Sparkles, AlertCircle, BookOpen, Plus, Minus } from "lucide-react";
import { LogTypeEnum, EvaluationGradeEnum, MemorizationLogRow } from "@/types";
import { createMemorizationLog } from "@/lib/actions/log";
import { SURAHS } from "@/lib/constants/quran";
import { Button } from "@/components/ui/button";
import { lightHaptic, successHaptic, warningHaptic } from "@/lib/haptics";
import { queuePendingAction } from "@/lib/offlineQueue";

export interface QuickRecitationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  latestSurah?: string | null;
  onSuccess?: (log: MemorizationLogRow) => void;
}

export function QuickRecitationSheet({
  isOpen,
  onClose,
  studentId,
  studentName,
  latestSurah,
  onSuccess,
}: QuickRecitationSheetProps) {
  const router = useRouter();

  // Form State
  const [logType, setLogType] = useState<LogTypeEnum>("جديد");
  const [surahName, setSurahName] = useState<string>(latestSurah || "الفاتحة");
  const [grade, setGrade] = useState<EvaluationGradeEnum>("ممتاز");
  const [pageCount, setPageCount] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default Surah if prop changes
  useEffect(() => {
    if (latestSurah) {
      setSurahName(latestSurah);
    }
  }, [latestSurah]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const selectedSurahMeta = useMemo(() => {
    return SURAHS.find((s) => s.name === surahName) || SURAHS[0];
  }, [surahName]);

  if (!isOpen) return null;

  const handleGradeSelect = (g: EvaluationGradeEnum) => {
    lightHaptic();
    setGrade(g);
  };

  const handleTypeSelect = (t: LogTypeEnum) => {
    lightHaptic();
    setLogType(t);
  };

  const handlePageChange = (delta: number) => {
    lightHaptic();
    setPageCount((prev) => {
      const next = Math.max(0.25, Number((prev + delta).toFixed(2)));
      return next;
    });
  };

  const handlePagePreset = (preset: number) => {
    lightHaptic();
    setPageCount(preset);
  };

  const handleSubmit = async () => {
    if (!studentId) return;

    setIsLoading(true);
    setError(null);

    const versesCount = selectedSurahMeta?.versesCount || 7;

    const payload = {
      student_id: studentId,
      log_type: logType,
      surah_start: surahName,
      aya_start: 1,
      surah_end: surahName,
      aya_end: versesCount,
      grade,
      page_count: pageCount,
      notes: null,
      assistant_name: null,
      surahs: [surahName],
      audio_url: null,
    };

    // 1. Offline handling
    if (typeof window !== "undefined" && !navigator.onLine) {
      queuePendingAction("recitation", payload);
      successHaptic();
      router.refresh();
      onClose();
      return;
    }

    // 2. Server Action
    try {
      const res = await createMemorizationLog(payload);

      if (res.success && res.data) {
        successHaptic();
        router.refresh();
        onSuccess?.(res.data);
        onClose();
      } else {
        if (!navigator.onLine || res.error?.includes("fetch") || res.error?.includes("network")) {
          queuePendingAction("recitation", payload);
          successHaptic();
          router.refresh();
          onClose();
        } else {
          warningHaptic();
          setError(res.error || "فشل تسجيل التسميع");
        }
      }
    } catch {
      queuePendingAction("recitation", payload);
      successHaptic();
      router.refresh();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("ar-JO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-teal-600/20 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>تسميع سريع:</span>
                <span className="text-teal-700 dark:text-teal-400">{studentName}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                📅 {todayFormatted}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Recitation Type Pill Selector */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-1.5">
              نوع التسميع
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "جديد", label: "حفظ جديد" },
                  { id: "مراجعة_صغرى", label: "مراجعة صغرى" },
                  { id: "مراجعة_كبرى", label: "مراجعة كبرى" },
                ] as const
              ).map((t) => {
                const isSelected = logType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeSelect(t.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                      isSelected
                        ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-[1.02]"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Surah Selection */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-1.5">
              السورة الكريمة
            </label>
            <div className="relative">
              <select
                value={surahName}
                onChange={(e) => {
                  lightHaptic();
                  setSurahName(e.target.value);
                }}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
              >
                {SURAHS.map((s) => (
                  <option key={s.id} value={s.name}>
                    سورة {s.name} ({s.versesCount} آية)
                  </option>
                ))}
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3. Evaluation Grade 1-Tap Pills */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-1.5">
              التقييم
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "ممتاز", label: "ممتاز ⭐", color: "from-emerald-500 to-teal-600 text-white" },
                  { id: "جيد_جدا", label: "جيد جداً 👍", color: "from-teal-500 to-cyan-600 text-white" },
                  { id: "جيد", label: "جيد ✨", color: "from-amber-500 to-amber-600 text-white" },
                ] as const
              ).map((g) => {
                const isSelected = grade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGradeSelect(g.id)}
                    className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${g.color} border-transparent shadow-md scale-[1.02]`
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Page Count Stepper & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400">
                مقدار الصفحات المنجزة
              </label>
              <div className="flex gap-1.5">
                {[0.5, 1, 2].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePagePreset(p)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-black border ${
                      pageCount === p
                        ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300"
                    }`}
                  >
                    {p} صفحة
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handlePageChange(-0.5)}
                disabled={pageCount <= 0.25}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 active:scale-95 transition-all"
                aria-label="إنقاص نصف صفحة"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center font-mono">
                <span className="text-xl font-black text-teal-700 dark:text-teal-400">
                  {pageCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5 font-sans font-bold">
                  صفحة
                </span>
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(0.5)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold active:scale-95 transition-all"
                aria-label="زيادة نصف صفحة"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full min-h-[48px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-lg shadow-teal-700/20 active:scale-[0.98] transition-all text-base gap-2"
          >
            {isLoading ? (
              <span>جاري الحفظ...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>حفظ التسميع فوراً (2-Clicks) ⚡</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
