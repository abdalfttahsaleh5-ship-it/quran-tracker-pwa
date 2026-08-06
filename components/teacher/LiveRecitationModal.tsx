"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Mic, CheckCircle2, ChevronRight, ChevronLeft, SkipForward, BookOpen, Award, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { StudentRow, MemorizationLogRow, LogTypeEnum, EvaluationGradeEnum } from "@/types";
import { createMemorizationLog } from "@/lib/actions/log";
import { QURAN_SURAHS } from "@/lib/constants/quran";
import { Button } from "@/components/ui/button";
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

  // Reset form inputs when active student index changes
  useEffect(() => {
    setLogType("جديد");
    setSurahStart("الفاتحة");
    setAyaStart(1);
    setSurahEnd("الفاتحة");
    setAyaEnd(7);
    setPageCount(1.0);
    setGrade("ممتاز");
    setNotes("");
    setErrorMessage(null);
  }, [currentIndex]);

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

  // Handle Early Return AFTER all hooks are unconditionally declared
  if (!isOpen) return null;

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
    setPageCount((prev) => {
      const updated = Math.max(0.25, Number((prev + delta).toFixed(2)));
      return updated;
    });
  };

  // Submit Recitation for Current Student and Advance
  const handleSaveAndNext = async () => {
    if (!currentStudent) return;
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
        setSessionCompletedCount((prev) => prev + 1);
        setSessionTotalPages((prev) => Number((prev + pageCount).toFixed(2)));
        setCurrentIndex((prev) => prev + 1);
      } else {
        setErrorMessage(res.error || "فشل حفظ التسميع، حاول مرة أخرى");
      }
    } catch (err) {
      setIsSubmitting(false);
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

  return (
    <div className="h-[100dvh] w-screen fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans dir-rtl overflow-hidden animate-in fade-in duration-200">
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
      <div className="flex-1 overflow-y-auto overscroll-contain webkit-overflow-scrolling-touch scroll-smooth p-4 sm:p-6 space-y-5 max-w-xl mx-auto w-full pb-36 touch-pan-y">
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

            {/* Active Student Info Header Card */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-800/50 border border-emerald-600/40 text-emerald-200 flex items-center justify-center font-black text-lg shrink-0">
                  {currentStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{currentStudent.full_name}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {currentStudent.academic_grade || "غير محدد"}
                  </p>
                </div>
              </div>

              {/* Last Recorded Recitation Badge */}
              <div className="text-left">
                <span className="inline-block px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-amber-300">
                  {lastStudentLog ? (
                    <>آخر تسميع: {lastStudentLog.log_type} ({lastStudentLog.page_count || 1} صفحة)</>
                  ) : (
                    <>لا يوجد تسميع سابق</>
                  )}
                </span>
              </div>
            </div>

            {/* Recitation Type Toggle Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">نوع التسميع 🎯</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLogType("جديد")}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all ${
                    logType === "جديد"
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  حفظ جديد 📖
                </button>
                <button
                  type="button"
                  onClick={() => setLogType("مراجعة_صغرى")}
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
                  onClick={() => setLogType("مراجعة_كبرى")}
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
                    onClick={() => setPageCount(preset)}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">السورة (البداية)</label>
                <select
                  value={surahStart}
                  onChange={(e) => {
                    setSurahStart(e.target.value);
                    if (!surahEnd) setSurahEnd(e.target.value);
                  }}
                  className="w-full p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.id}. سورة {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">السورة (النهاية)</label>
                <select
                  value={surahEnd}
                  onChange={(e) => setSurahEnd(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.id}. سورة {s.name}
                    </option>
                  ))}
                </select>
              </div>
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

      {/* Sticky Bottom Navigation Controls */}
      {!isFinished && currentStudent && (
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-3 sm:p-4 shrink-0 flex items-center justify-between gap-2 max-w-xl mx-auto w-full">
          {/* Previous Student */}
          <Button
            type="button"
            variant="outline"
            disabled={currentIndex === 0 || isSubmitting}
            onClick={handlePrevious}
            className="rounded-2xl border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs font-bold px-3"
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
            className="rounded-2xl text-slate-400 hover:text-slate-200 text-xs font-bold gap-1 px-3"
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
      )}
    </div>
  );
}
