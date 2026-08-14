"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Mic, CheckCircle2, ChevronRight, ChevronLeft, SkipForward, BookOpen, Award, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { StudentRow, MemorizationLogRow, LogTypeEnum, EvaluationGradeEnum } from "@/types";
import { createMemorizationLog } from "@/lib/actions/log";
import { QURAN_SURAHS } from "@/lib/constants/quran";
import {
  getSurahStandardPages,
  calculateRecitationPages,
  getStudentMemorizedSurahsMap,
  normalizeSurahName,
  MemorizedSurahRecord,
} from "@/lib/quranMetadata";
import { Button } from "@/components/ui/button";
import { lightHaptic, successHaptic, warningHaptic } from "@/lib/haptics";
import { useRouter } from "next/navigation";

interface LiveRecitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRow[];
  logs?: MemorizationLogRow[];
}

export function LiveRecitationModal({
  isOpen,
  onClose,
  students = [],
  logs = [],
}: LiveRecitationModalProps) {
  const router = useRouter();

  // Mount state for Next.js SSR / Portal rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scrolling when modal is active
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

  // Navigation & Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [sessionTotalPages, setSessionTotalPages] = useState(0);

  // Form State for Active Student
  const [logType, setLogType] = useState<LogTypeEnum>("جديد");
  const [surahStart, setSurahStart] = useState<string>("الفاتحة");
  const [ayaStart, setAyaStart] = useState<number>(1);
  const [surahEnd, setSurahEnd] = useState<string>("الفاتحة");
  const [ayaEnd, setAyaEnd] = useState<number>(7);
  const [pageCount, setPageCount] = useState<number>(1.0);
  const [grade, setGrade] = useState<EvaluationGradeEnum>("ممتاز");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Safe Student Bounds & Current Selection
  const currentStudent = students && students.length > 0 && currentIndex < students.length
    ? students[currentIndex]
    : null;

  // Map of memorized Surahs for the active student
  const memorizedSurahsMap = useMemo(() => {
    if (!currentStudent || !logs || logs.length === 0) return new Map<string, MemorizedSurahRecord>();
    return getStudentMemorizedSurahsMap(logs, currentStudent.id);
  }, [currentStudent, logs]);

  // Check if current selected Surah range contains already-memorized Surah
  const selectedSurahRecord = useMemo(() => {
    const normStart = normalizeSurahName(surahStart);
    const normEnd = normalizeSurahName(surahEnd || surahStart);
    return memorizedSurahsMap.get(normStart) || memorizedSurahsMap.get(normEnd) || null;
  }, [memorizedSurahsMap, surahStart, surahEnd]);

  const isSurahAlreadyMemorized = Boolean(selectedSurahRecord);

  // Automatically force recitation type to revision if already memorized
  useEffect(() => {
    if (isSurahAlreadyMemorized && logType === "جديد") {
      setLogType("مراجعة_صغرى");
    }
  }, [isSurahAlreadyMemorized, logType]);

  // Reset and auto-select form inputs when active student changes
  useEffect(() => {
    setGrade("ممتاز");
    setNotes("");
    setErrorMessage(null);

    if (currentStudent && logs && logs.length > 0) {
      const studentLogs = logs.filter((l) => l.student_id === currentStudent.id);
      if (studentLogs.length > 0) {
        const sorted = [...studentLogs].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        const lastLog = sorted[0];
        const rawSurahName = lastLog.surah_end || lastLog.surah_start || "";
        const cleanName = rawSurahName.replace(/^سورة\s*/, "").trim();
        const lastSurahObj = QURAN_SURAHS.find(
          (s) => s.name === cleanName || s.name === rawSurahName
        );

        if (lastSurahObj) {
          let nextSurah = lastSurahObj;
          // If student finished all ayahs of the last surah, advance to next surah in Quran order
          if (lastLog.aya_end >= lastSurahObj.numberOfAyahs && lastSurahObj.id < 114) {
            const nextSurahObj = QURAN_SURAHS.find((s) => s.id === lastSurahObj.id + 1);
            if (nextSurahObj) {
              nextSurah = nextSurahObj;
            }
          }

          const memMap = getStudentMemorizedSurahsMap(logs, currentStudent.id);
          const isNextMem = memMap.has(normalizeSurahName(nextSurah.name));

          setSurahStart(nextSurah.name);
          setSurahEnd(nextSurah.name);
          setAyaStart(1);
          setAyaEnd(nextSurah.numberOfAyahs);
          setPageCount(getSurahStandardPages(nextSurah.name));
          setLogType(isNextMem ? "مراجعة_صغرى" : "جديد");
          return;
        }
      }
    }

    // Default fallback if no previous log or student
    const fallbackMem = currentStudent ? getStudentMemorizedSurahsMap(logs, currentStudent.id).has("الفاتحة") : false;
    setSurahStart("الفاتحة");
    setSurahEnd("الفاتحة");
    setAyaStart(1);
    setAyaEnd(7);
    setPageCount(getSurahStandardPages("الفاتحة"));
    setLogType(fallbackMem ? "مراجعة_صغرى" : "جديد");
  }, [currentIndex, currentStudent, logs]);

  // Reset session counters whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSessionCompletedCount(0);
      setSessionTotalPages(0);
    }
  }, [isOpen]);

  // Derive active student's last recorded log (Declared BEFORE conditional return)
  const lastStudentLog = useMemo(() => {
    if (!currentStudent || !logs || logs.length === 0) return null;
    const studentLogs = logs.filter((l) => l.student_id === currentStudent.id);
    if (studentLogs.length === 0) return null;
    return [...studentLogs].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )[0];
  }, [currentStudent, logs]);

  // Format "Last Recitation Info" text for badge
  const lastRecitationBadgeText = useMemo(() => {
    if (!lastStudentLog) {
      return "آخر تسميع: جديد (لا يوجد سجل سابق)";
    }

    const rawSurah = lastStudentLog.surah_end || lastStudentLog.surah_start || "";
    const surahName = rawSurah.startsWith("سورة") ? rawSurah : `سورة ${rawSurah}`;

    if (lastStudentLog.page_count) {
      return `آخر تسميع: ${surahName} (${lastStudentLog.page_count} صفحة)`;
    }
    return `آخر تسميع: ${surahName}`;
  }, [lastStudentLog]);

  // Handle Early Return AFTER all hooks are unconditionally declared
  if (!isOpen || !mounted) return null;

  const safeStudentsLength = students ? students.length : 0;
  const isFinished = currentIndex >= safeStudentsLength || safeStudentsLength === 0 || !currentStudent;

  const currentDateFormatted = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const progressPercentage = safeStudentsLength > 0
    ? Math.min(100, Math.round((currentIndex / safeStudentsLength) * 100))
    : 100;

  // Handle Page Count Adjustment (+ / - 0.5)
  const adjustPageCount = (delta: number) => {
    lightHaptic();
    setPageCount((prev) => {
      const updated = Math.max(0.25, Number((prev + delta).toFixed(2)));
      return updated;
    });
  };

  // Submit Recitation for Current Student and Advance
  const handleSaveAndNext = async () => {
    if (!currentStudent) return;

    // Strict Duplicate Memorization Guard: reject and warn if attempted as 'جديد' when already memorized
    if (logType === "جديد" && isSurahAlreadyMemorized && selectedSurahRecord) {
      warningHaptic();
      setErrorMessage(
        `⚠️ تم حفظ سورة (${selectedSurahRecord.surahName}) مسبقاً بتاريخ (${selectedSurahRecord.formattedDate}). تم قفل خيار (حفظ جديد) وتوجيه التسجيل إلى (مراجعة).`
      );
      setLogType("مراجعة_صغرى");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await createMemorizationLog({
        student_id: currentStudent.id,
        log_type: logType,
        surah_start: surahStart,
        aya_start: ayaStart,
        surah_end: surahEnd || surahStart,
        aya_end: ayaEnd,
        grade: grade,
        page_count: pageCount,
        notes: notes.trim() || null,
      });

      setIsSubmitting(false);

      if (res.success) {
        successHaptic();
        setSessionCompletedCount((prev) => prev + 1);
        setSessionTotalPages((prev) => Number((prev + pageCount).toFixed(2)));
        setCurrentIndex((prev) => prev + 1);
      } else {
        warningHaptic();
        setErrorMessage(res.error || "فشل حفظ التسميع، حاول مرة أخرى");
      }
    } catch (err) {
      setIsSubmitting(false);
      warningHaptic();
      setErrorMessage("حدث خطأ غير متوقع أثناء الحفظ");
    }
  };

  // Skip Student
  const handleSkip = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  // Go to Previous Student
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinishClose = () => {
    router.refresh();
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col h-[100dvh] w-screen bg-slate-900 overflow-hidden text-slate-100 font-sans dir-rtl animate-in fade-in duration-200">
      {/* Top Header Controls */}
      <div className="sticky top-0 bg-slate-900/90 border-b border-slate-800 z-10 p-3 sm:p-4 shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              <span>التسميع المباشر للحلقة 🎙️</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">{currentDateFormatted}</p>
          </div>
        </div>

        {/* Position Counter Badge */}
        {!isFinished && safeStudentsLength > 0 && (
          <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-black text-xs sm:text-sm">
            طالب {currentIndex + 1} من {safeStudentsLength}
          </div>
        )}

        <button
          onClick={handleFinishClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Top Progress Bar Indicator */}
      <div className="w-full bg-slate-800 h-1.5 shrink-0 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Main Content Area with Smooth Touch-Scrolling & Bottom Clearance */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-36 overscroll-contain max-w-xl mx-auto w-full scroll-smooth webkit-overflow-scrolling-touch">
        {isFinished || !currentStudent ? (
          /* Completion Screen */
          <div className="py-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-400 mx-auto flex items-center justify-center text-4xl shadow-xl">
              🎉
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">تم بحمد الله إكمال التسميع!</h3>
              <p className="text-sm text-slate-400 font-medium">
                تم تسجيل إنجازات الطلاب في الجلسة المباشرة بنجاح ✨
              </p>
            </div>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 font-bold block mb-1">الطلاب المكتملون</span>
                <span className="text-xl font-black text-emerald-400">
                  {sessionCompletedCount} / {safeStudentsLength}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي الصفحات</span>
                <span className="text-xl font-black text-amber-400">📖 {sessionTotalPages}</span>
              </div>
            </div>

            <Button
              onClick={handleFinishClose}
              className="w-full max-w-md py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg text-base"
            >
              إغلاق والعودة للرئيسية 🏠
            </Button>
          </div>
        ) : (
          /* Live Recitation Form for Current Student */
          <>
            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Active Student Info Header Card with Highlighted Last Recitation Badge */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-800/50 border border-emerald-600/40 text-emerald-200 flex items-center justify-center font-black text-lg shrink-0 shadow-inner">
                    {currentStudent.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{currentStudent.full_name}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {currentStudent.academic_grade || "غير محدد"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prominent Highlighted Last Recitation Info Badge */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2.5 shadow-sm">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{lastRecitationBadgeText}</span>
              </div>
            </div>

            {/* Recitation Type Toggle Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">نوع التسميع 🎯</label>
                {isSurahAlreadyMemorized && (
                  <span className="text-[11px] font-extrabold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800/80">
                    🔒 مقفل للحفظ الجديد
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isSurahAlreadyMemorized}
                  onClick={() => {
                    if (!isSurahAlreadyMemorized) {
                      lightHaptic();
                      setLogType("جديد");
                    } else {
                      warningHaptic();
                    }
                  }}
                  title={isSurahAlreadyMemorized ? "تم حفظ هذه السورة مسبقاً لهذا الطالب" : "حفظ جديد"}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all ${
                    isSurahAlreadyMemorized
                      ? "opacity-35 cursor-not-allowed bg-slate-950 border-slate-850 text-slate-500 line-through"
                      : logType === "جديد"
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  حفظ جديد 📖
                </button>
                <button
                  type="button"
                  onClick={() => {
                    lightHaptic();
                    setLogType("مراجعة_صغرى");
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all ${
                    logType === "مراجعة_صغرى"
                      ? "bg-teal-600 border-teal-500 text-white shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  مراجعة صغرى 🔄
                </button>
                <button
                  type="button"
                  onClick={() => {
                    lightHaptic();
                    setLogType("مراجعة_كبرى");
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all ${
                    logType === "مراجعة_كبرى"
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  مراجعة كبرى 📚
                </button>
              </div>
            </div>

            {/* Page Count Counter Input */}
            <div className="space-y-1.5 p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">عدد الصفحات المنجزة 📄</label>
                <span className="text-lg font-black text-emerald-400">{pageCount} صفحة</span>
              </div>

              {/* +/- Stepper Controls */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => adjustPageCount(-0.5)}
                  className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-black text-xl flex items-center justify-center active:scale-95 border border-slate-700"
                >
                  -
                </button>
                <div className="flex-1 text-center py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xl font-black text-white">
                  {pageCount}
                </div>
                <button
                  type="button"
                  onClick={() => adjustPageCount(0.5)}
                  className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-black text-xl flex items-center justify-center active:scale-95 border border-slate-700"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-2">
                {[0.5, 1.0, 2.0, 3.0, 5.0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      lightHaptic();
                      setPageCount(preset);
                    }}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-xl border transition-all ${
                      pageCount === preset
                        ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Surah Selection */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">السورة (البداية)</label>
                  <select
                    value={surahStart}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const wasSameSurah = !surahEnd || surahStart === surahEnd;
                      setSurahStart(selectedName);
                      const targetEnd = wasSameSurah ? selectedName : surahEnd;
                      if (wasSameSurah) {
                        setSurahEnd(selectedName);
                      }
                      const surahObj = QURAN_SURAHS.find((s) => s.name === selectedName);
                      if (surahObj) {
                        setAyaStart(1);
                        if (wasSameSurah) {
                          setAyaEnd(surahObj.numberOfAyahs);
                        }
                      }
                      const calculated = calculateRecitationPages(selectedName, targetEnd);
                      setPageCount(calculated);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100"
                  >
                    {QURAN_SURAHS.map((s) => {
                      const isMem = memorizedSurahsMap.has(normalizeSurahName(s.name));
                      return (
                        <option key={s.id} value={s.name}>
                          {isMem ? `✅ ${s.id}. سورة ${s.name} (تم الحفظ)` : `${s.id}. سورة ${s.name}`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">السورة (النهاية)</label>
                  <select
                    value={surahEnd}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setSurahEnd(selectedName);
                      const surahObj = QURAN_SURAHS.find((s) => s.name === selectedName);
                      if (surahObj) {
                        setAyaEnd(surahObj.numberOfAyahs);
                      }
                      const calculated = calculateRecitationPages(surahStart, selectedName);
                      setPageCount(calculated);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100"
                  >
                    {QURAN_SURAHS.map((s) => {
                      const isMem = memorizedSurahsMap.has(normalizeSurahName(s.name));
                      return (
                        <option key={s.id} value={s.name}>
                          {isMem ? `✅ ${s.id}. سورة ${s.name} (تم الحفظ)` : `${s.id}. سورة ${s.name}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Prominent Amber Warning Box when Surah was previously memorized */}
              {isSurahAlreadyMemorized && selectedSurahRecord && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in fade-in duration-200">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="space-y-1 leading-relaxed">
                    <p>
                      تم حفظ <strong className="text-amber-100 underline decoration-amber-400 decoration-2 font-black">سورة {selectedSurahRecord.surahName}</strong> مسبقاً بتاريخ (
                      <span className="font-black text-amber-100">{selectedSurahRecord.formattedDate}</span>).
                    </p>
                    <p className="text-[11px] text-amber-300/90 font-medium">
                      تم قفل خيار (حفظ جديد) وتوجيه التسجيل إلى (مراجعة) لمنع تكرار احتساب الصفحات.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Evaluation Grade Rating Badges */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">تقييم التسميع ⭐</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setGrade("ممتاز")}
                  className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 ${
                    grade === "ممتاز"
                      ? "bg-emerald-600 border-emerald-400 text-white ring-2 ring-emerald-400/40 shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-base">🟢</span>
                  <span>ممتاز</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrade("جيد_جدا")}
                  className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 ${
                    grade === "جيد_جدا"
                      ? "bg-amber-500 border-amber-300 text-slate-950 ring-2 ring-amber-400/40 shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-base">🟡</span>
                  <span>جيد جداً</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrade("جيد")}
                  className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 ${
                    grade === "جيد"
                      ? "bg-orange-500 border-orange-300 text-white ring-2 ring-orange-400/40 shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-base">🟠</span>
                  <span>جيد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrade("يحتاج_تحسين")}
                  className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 ${
                    grade === "يحتاج_تحسين"
                      ? "bg-rose-600 border-rose-400 text-white ring-2 ring-rose-400/40 shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-base">🔴</span>
                  <span>إعادة</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Permanently Fixed Bottom Action Footer */}
      {!isFinished && currentStudent && (
        <div className="fixed bottom-0 inset-x-0 z-[10000] bg-slate-900 border-t border-slate-800 p-3 pb-8 shadow-2xl flex items-center gap-2">
          <div className="max-w-xl mx-auto w-full flex items-center gap-2">
            {/* Previous Student */}
            <Button
              type="button"
              variant="outline"
              disabled={currentIndex === 0 || isSubmitting}
              onClick={handlePrevious}
              className="rounded-2xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs font-bold px-3 shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">السابق</span>
            </Button>

            {/* Skip Student */}
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={handleSkip}
              className="rounded-2xl text-slate-400 hover:text-slate-200 text-xs font-bold gap-1 px-3 shrink-0"
            >
              <SkipForward className="w-4 h-4" />
              <span>تجاوز</span>
            </Button>

            {/* Save & Next Student */}
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAndNext}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg gap-2 text-sm"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>حفظ والتالي ➡️</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}

