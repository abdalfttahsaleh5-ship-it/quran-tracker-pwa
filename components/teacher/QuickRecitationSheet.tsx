"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Zap, CheckCircle2, AlertCircle, BookOpen, Loader2, ArrowRightLeft } from "lucide-react";
import { LogTypeEnum, EvaluationGradeEnum, MemorizationLogRow } from "@/types";
import { createMemorizationLog } from "@/lib/actions/log";
import { memorizationLogSchema, MemorizationLogInput } from "@/lib/validations/log";
import { QURAN_SURAHS } from "@/lib/constants/quran";
import {
  calculateRecitationPages,
  normalizeSurahName,
} from "@/lib/quranMetadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [surahStart, setSurahStart] = useState<string>(latestSurah || "الفاتحة");
  const [surahEnd, setSurahEnd] = useState<string>(latestSurah || "الفاتحة");
  const [ayaStart, setAyaStart] = useState<number>(1);
  const [ayaEnd, setAyaEnd] = useState<number>(7);
  const [grade, setGrade] = useState<EvaluationGradeEnum>("ممتاز");
  const [isCrossSurah, setIsCrossSurah] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Metadata for start and end surahs
  const startSurahObj = useMemo(() => {
    const clean = normalizeSurahName(surahStart);
    return QURAN_SURAHS.find((s) => s.name === clean || s.name === surahStart) || QURAN_SURAHS[0];
  }, [surahStart]);

  const endSurahObj = useMemo(() => {
    if (!isCrossSurah) return startSurahObj;
    const clean = normalizeSurahName(surahEnd);
    return QURAN_SURAHS.find((s) => s.name === clean || s.name === surahEnd) || startSurahObj;
  }, [surahEnd, isCrossSurah, startSurahObj]);

  // Sync default Surah on mount / prop update
  useEffect(() => {
    if (!isOpen) return;

    const initialName = latestSurah || "الفاتحة";
    const clean = normalizeSurahName(initialName);
    const sObj = QURAN_SURAHS.find((s) => s.name === clean || s.name === initialName) || QURAN_SURAHS[0];

    setSurahStart(sObj.name);
    setSurahEnd(sObj.name);
    setAyaStart(1);
    setAyaEnd(sObj.numberOfAyahs);
    setIsCrossSurah(false);
    setError(null);
    setIsLoading(false);
  }, [isOpen, latestSurah]);

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

  // Primary Surah selection handler with smart verse bounds
  const handlePrimarySurahChange = (name: string) => {
    lightHaptic();
    setSurahStart(name);
    const sObj = QURAN_SURAHS.find((s) => s.name === name);
    const totalAyahs = sObj ? sObj.numberOfAyahs : 7;

    setAyaStart(1);
    if (!isCrossSurah) {
      setSurahEnd(name);
      setAyaEnd(totalAyahs);
    }
    setError(null);
  };

  // Secondary (End) Surah selection handler
  const handleEndSurahChange = (name: string) => {
    lightHaptic();
    setSurahEnd(name);
    const sObj = QURAN_SURAHS.find((s) => s.name === name);
    if (sObj) {
      setAyaEnd(sObj.numberOfAyahs);
    }
    setError(null);
  };

  // Calculate pages automatically using central engine
  const calculatedPages = useMemo(() => {
    const targetEnd = isCrossSurah ? surahEnd : surahStart;
    const fromA = Math.max(1, Number(ayaStart) || 1);
    const toA = Math.max(1, Number(ayaEnd) || 1);
    return calculateRecitationPages(surahStart, targetEnd, fromA, toA);
  }, [surahStart, surahEnd, ayaStart, ayaEnd, isCrossSurah]);

  // Calculate total ayahs in range
  const totalAyahsRecited = useMemo(() => {
    const fromA = Number(ayaStart) || 1;
    const toA = Number(ayaEnd) || 1;

    if (!isCrossSurah || startSurahObj.id === endSurahObj.id) {
      return Math.max(0, toA - fromA + 1);
    }

    const minId = Math.min(startSurahObj.id, endSurahObj.id);
    const maxId = Math.max(startSurahObj.id, endSurahObj.id);

    let count = 0;
    for (let id = minId; id <= maxId; id++) {
      const s = QURAN_SURAHS.find((item) => item.id === id);
      if (!s) continue;

      if (id === startSurahObj.id) {
        count += Math.max(0, s.numberOfAyahs - fromA + 1);
      } else if (id === endSurahObj.id) {
        count += Math.max(0, toA);
      } else {
        count += s.numberOfAyahs;
      }
    }
    return count;
  }, [startSurahObj, endSurahObj, ayaStart, ayaEnd, isCrossSurah]);

  if (!isOpen) return null;

  const handleGradeSelect = (g: EvaluationGradeEnum) => {
    lightHaptic();
    setGrade(g);
  };

  const handleTypeSelect = (t: LogTypeEnum) => {
    lightHaptic();
    setLogType(t);
  };

  const handleSubmit = async () => {
    if (!studentId) return;

    setError(null);

    const fromA = Number(ayaStart);
    const toA = Number(ayaEnd);

    // Client-side Quran validation
    if (isNaN(fromA) || fromA < 1) {
      warningHaptic();
      setError("آية البداية يجب أن تكون 1 أو أكثر");
      return;
    }

    if (isNaN(toA) || toA < 1) {
      warningHaptic();
      setError("آية النهاية يجب أن تكون 1 أو أكثر");
      return;
    }

    if (fromA > startSurahObj.numberOfAyahs) {
      warningHaptic();
      setError(`آية البداية (${fromA}) تتجاوز عدد آيات سورة ${startSurahObj.name} (${startSurahObj.numberOfAyahs} آية)`);
      return;
    }

    if (toA > endSurahObj.numberOfAyahs) {
      warningHaptic();
      setError(`آية النهاية (${toA}) تتجاوز عدد آيات سورة ${endSurahObj.name} (${endSurahObj.numberOfAyahs} آية)`);
      return;
    }

    if (!isCrossSurah && toA < fromA) {
      warningHaptic();
      setError(`آية النهاية (${toA}) يجب أن تكون أكبر من أو تساوي آية البداية (${fromA})`);
      return;
    }

    if (isCrossSurah && endSurahObj.id < startSurahObj.id) {
      warningHaptic();
      setError("سورة النهاية يجب أن تلي سورة البداية في ترتيب المصحف الشريف");
      return;
    }

    const payload: MemorizationLogInput = {
      student_id: studentId,
      log_type: logType,
      surah_start: surahStart,
      aya_start: fromA,
      surah_end: isCrossSurah ? surahEnd : surahStart,
      aya_end: toA,
      grade,
      page_count: calculatedPages,
      notes: null,
      assistant_name: null,
      surahs: [surahStart, ...(isCrossSurah && surahEnd !== surahStart ? [surahEnd] : [])],
      audio_url: null,
    };

    // Validate using central Zod schema
    const parseResult = memorizationLogSchema.safeParse(payload);
    if (!parseResult.success) {
      warningHaptic();
      const firstErr = parseResult.error.errors[0]?.message || "بيانات التسميع غير مكتملة";
      setError(firstErr);
      return;
    }

    setIsLoading(true);

    // 1. Offline handling
    if (typeof window !== "undefined" && !navigator.onLine) {
      queuePendingAction("recitation", payload);
      successHaptic();
      router.refresh();
      const offlineLog: MemorizationLogRow = {
        id: `offline_${Date.now()}`,
        student_id: studentId,
        teacher_id: "offline",
        log_type: payload.log_type,
        surah_start: payload.surah_start,
        aya_start: payload.aya_start,
        surah_end: payload.surah_end,
        aya_end: payload.aya_end,
        grade: payload.grade,
        date: new Date().toISOString().split("T")[0],
        page_count: payload.page_count ?? null,
        notes: null,
        assistant_name: null,
        surahs: payload.surahs || null,
        audio_url: null,
        rating: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
      };
      onSuccess?.(offlineLog);
      onClose();
      return;
    }

    // 2. Central Server Action execution
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] animate-in slide-in-from-bottom duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
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
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Recitation Type Selection */}
          <div>
            <Label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-1.5">
              نوع التسميع
            </Label>
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
                    className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-black border transition-all ${
                      isSelected
                        ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-[1.01]"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Surah & Ayah Range Selection */}
          <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Primary Surah */}
            <div className="space-y-1">
              <Label htmlFor="quick_surah_start" className="text-xs font-black text-teal-900 dark:text-teal-300">
                {isCrossSurah ? "سورة البداية *" : "السورة الكريمة *"}
              </Label>
              <div className="relative">
                <select
                  id="quick_surah_start"
                  value={surahStart}
                  onChange={(e) => handlePrimarySurahChange(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none transition-all"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.id}. سورة {s.name} ({s.numberOfAyahs} آية)
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* End Surah (if Cross-Surah is active) */}
            {isCrossSurah && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <Label htmlFor="quick_surah_end" className="text-xs font-black text-teal-900 dark:text-teal-300">
                  سورة النهاية *
                </Label>
                <div className="relative">
                  <select
                    id="quick_surah_end"
                    value={surahEnd}
                    onChange={(e) => handleEndSurahChange(e.target.value)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none transition-all"
                  >
                    {QURAN_SURAHS.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.id}. سورة {s.name} ({s.numberOfAyahs} آية)
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* Ayah Range Inputs */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <Label htmlFor="quick_aya_start" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  من آية
                </Label>
                <Input
                  id="quick_aya_start"
                  type="number"
                  min={1}
                  max={startSurahObj.numberOfAyahs}
                  value={ayaStart}
                  onChange={(e) => setAyaStart(parseInt(e.target.value, 10) || 1)}
                  className="h-10 font-mono text-center font-bold text-sm rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="quick_aya_end" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  إلى آية
                </Label>
                <Input
                  id="quick_aya_end"
                  type="number"
                  min={1}
                  max={endSurahObj.numberOfAyahs}
                  value={ayaEnd}
                  onChange={(e) => setAyaEnd(parseInt(e.target.value, 10) || 1)}
                  className="h-10 font-mono text-center font-bold text-sm rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Cross-Surah Toggle */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  lightHaptic();
                  const next = !isCrossSurah;
                  setIsCrossSurah(next);
                  if (!next) {
                    setSurahEnd(surahStart);
                    setAyaEnd(startSurahObj.numberOfAyahs);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{isCrossSurah ? "إلغاء التسميع الممتد (نفس السورة)" : "+ تسميع ممتد عبر أكثر من سورة (Cross-Surah)"}</span>
              </button>
            </div>
          </div>

          {/* 3. Live Smart Recitation Summary Card */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 p-3 rounded-2xl border border-teal-200 dark:border-teal-900/60 flex items-center justify-between gap-2 flex-wrap">
            <div className="space-y-0.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-teal-800 dark:text-teal-300 font-black">📖 السورة:</span>
                <span>{isCrossSurah ? `${surahStart} ➔ ${surahEnd}` : surahStart}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span>🔢 الآيات:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ayaStart} ➔ {ayaEnd}</span>
                <span>({totalAyahsRecited} آية)</span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[10px] text-teal-700 dark:text-teal-400 block font-bold">الصفحات المكافئة:</span>
              <span className="text-base font-black font-mono text-teal-900 dark:text-teal-200 bg-white/80 dark:bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-teal-200/80 dark:border-teal-800 shadow-sm inline-block">
                {calculatedPages} صفحة
              </span>
            </div>
          </div>

          {/* 4. Evaluation Grade Selection */}
          <div>
            <Label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-1.5">
              التقييم
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: "ممتاز", label: "ممتاز ⭐", color: "from-emerald-500 to-teal-600 text-white" },
                  { id: "جيد_جدا", label: "جيد جداً 👍", color: "from-teal-500 to-cyan-600 text-white" },
                  { id: "جيد", label: "جيد ✨", color: "from-amber-500 to-amber-600 text-white" },
                  { id: "يحتاج_تحسين", label: "يحتاج تحسين ⚠️", color: "from-rose-500 to-rose-600 text-white" },
                ] as const
              ).map((g) => {
                const isSelected = grade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGradeSelect(g.id)}
                    className={`min-h-[40px] px-1.5 py-2 rounded-xl text-[11px] sm:text-xs font-black border transition-all text-center ${
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
        </div>

        {/* Fixed Bottom Action Footer */}
        <div className="p-4 pt-3 pb-6 sm:pb-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 shadow-lg">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full min-h-[50px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-black rounded-2xl shadow-lg shadow-teal-700/20 active:scale-[0.98] transition-all text-base gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري حفظ التسميع...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>حفظ التسميع</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
