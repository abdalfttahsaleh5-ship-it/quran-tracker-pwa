"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, X, CheckCircle2, UserCheck, Hash, ChevronDown } from "lucide-react";
import { memorizationLogSchema, MemorizationLogInput } from "@/lib/validations/log";
import { createMemorizationLog } from "@/lib/actions/log";
import { QURAN_SURAHS } from "@/lib/constants/quran";
import {
  calculateRecitationPages,
  getSurahStandardPages,
  getStudentMemorizedSurahsMap,
  normalizeSurahName,
  MemorizedSurahRecord,
} from "@/lib/quranMetadata";
import { LogTypeEnum, EvaluationGradeEnum, MemorizationLogRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lightHaptic, successHaptic, warningHaptic } from "@/lib/haptics";

interface LogEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  existingLogs?: MemorizationLogRow[];
  onSuccess?: (log: MemorizationLogRow) => void;
}

export function LogEntryDialog({
  isOpen,
  onClose,
  studentId,
  studentName,
  existingLogs = [],
  onSuccess,
}: LogEntryDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCrossSurah, setIsCrossSurah] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MemorizationLogInput>({
    resolver: zodResolver(memorizationLogSchema),
    defaultValues: {
      student_id: studentId,
      log_type: "جديد",
      surah_start: "الفاتحة",
      aya_start: 1,
      surah_end: "الفاتحة",
      aya_end: 7,
      grade: "ممتاز",
      notes: "",
      assistant_name: "",
      page_count: 1,
    },
  });

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const savedAssistant = localStorage.getItem("quran_tracker_last_assistant_name");
      if (savedAssistant) {
        setValue("assistant_name", savedAssistant);
      }
    }
  }, [isOpen, setValue]);

  const selectedSurahStart = watch("surah_start");
  const selectedSurahEnd = watch("surah_end");
  const selectedAyaStart = watch("aya_start");
  const selectedAyaEnd = watch("aya_end");
  const selectedLogType = watch("log_type");
  const selectedGrade = watch("grade");
  const currentPageCount = watch("page_count");

  // Map of memorized Surahs for this student
  const memorizedSurahsMap = useMemo(() => {
    return getStudentMemorizedSurahsMap(existingLogs, studentId);
  }, [existingLogs, studentId]);

  // Check if currently selected Surah was already memorized
  const selectedSurahRecord = useMemo(() => {
    const normStart = normalizeSurahName(selectedSurahStart || "");
    const normEnd = normalizeSurahName(selectedSurahEnd || selectedSurahStart || "");
    return memorizedSurahsMap.get(normStart) || (isCrossSurah ? memorizedSurahsMap.get(normEnd) : null) || null;
  }, [memorizedSurahsMap, selectedSurahStart, selectedSurahEnd, isCrossSurah]);

  const isSurahAlreadyMemorized = Boolean(selectedSurahRecord);

  // Automatically force recitation type to revision if already memorized
  useEffect(() => {
    if (isSurahAlreadyMemorized && selectedLogType === "جديد") {
      setValue("log_type", "مراجعة_صغرى");
    }
  }, [isSurahAlreadyMemorized, selectedLogType, setValue]);

  // Set default initial surah & log_type based on student's history on modal open
  useEffect(() => {
    if (isOpen && existingLogs && existingLogs.length > 0) {
      const studentLogs = existingLogs.filter((l) => l.student_id === studentId);
      if (studentLogs.length > 0) {
        const sorted = [...studentLogs].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        const lastLog = sorted[0];
        const rawSurahName = lastLog.surah_end || lastLog.surah_start || "";
        const cleanName = normalizeSurahName(rawSurahName);
        const lastSurahObj = QURAN_SURAHS.find(
          (s) => s.name === cleanName || s.name === rawSurahName
        );

        if (lastSurahObj) {
          let nextSurah = lastSurahObj;
          if (lastLog.aya_end >= lastSurahObj.numberOfAyahs && lastSurahObj.id < 114) {
            const nextSurahObj = QURAN_SURAHS.find((s) => s.id === lastSurahObj.id + 1);
            if (nextSurahObj) {
              nextSurah = nextSurahObj;
            }
          }
          const memMap = getStudentMemorizedSurahsMap(existingLogs, studentId);
          const isNextMem = memMap.has(normalizeSurahName(nextSurah.name));

          setValue("surah_start", nextSurah.name);
          setValue("surah_end", nextSurah.name);
          setValue("aya_start", 1);
          setValue("aya_end", nextSurah.numberOfAyahs);
          setValue("page_count", getSurahStandardPages(nextSurah.name));
          setValue("log_type", isNextMem ? "مراجعة_صغرى" : "جديد");
          return;
        }
      }
    }
  }, [isOpen, existingLogs, studentId, setValue]);

  // Automatically update page_count when surah, ayah, or cross-surah state changes
  useEffect(() => {
    if (!selectedSurahStart) return;

    const targetSurahName = isCrossSurah ? (selectedSurahEnd || selectedSurahStart) : selectedSurahStart;
    const fromAyah = Number(selectedAyaStart) || 1;
    const toAyah = Number(selectedAyaEnd) || undefined;

    const calculatedPages = calculateRecitationPages(selectedSurahStart, targetSurahName, fromAyah, toAyah);
    setValue("page_count", calculatedPages);
  }, [selectedSurahStart, selectedSurahEnd, selectedAyaStart, selectedAyaEnd, isCrossSurah, setValue]);

  // Auto-fill verse range upon selecting primary surah
  const handlePrimarySurahChange = (surahName: string) => {
    setValue("surah_start", surahName);
    const targetEnd = !isCrossSurah ? surahName : (selectedSurahEnd || surahName);
    if (!isCrossSurah) {
      setValue("surah_end", surahName);
    }
    const surahObj = QURAN_SURAHS.find((s) => s.name === surahName);
    if (surahObj) {
      setValue("aya_start", 1);
      if (!isCrossSurah) {
        setValue("aya_end", surahObj.numberOfAyahs);
      }
    }
    const calculatedPages = calculateRecitationPages(
      surahName,
      targetEnd,
      1,
      !isCrossSurah ? surahObj?.numberOfAyahs : (Number(selectedAyaEnd) || undefined)
    );
    setValue("page_count", calculatedPages);

    const memMap = getStudentMemorizedSurahsMap(existingLogs, studentId);
    if (memMap.has(normalizeSurahName(surahName))) {
      setValue("log_type", "مراجعة_صغرى");
    }
  };

  if (!isOpen) return null;

  const handleFormSubmit = async (data: MemorizationLogInput) => {
    // Strict Duplicate Memorization Guard
    if (data.log_type === "جديد" && isSurahAlreadyMemorized && selectedSurahRecord) {
      warningHaptic();
      setError(
        `⚠️ تم حفظ سورة (${selectedSurahRecord.surahName}) مسبقاً بتاريخ (${selectedSurahRecord.formattedDate}). تم قفل خيار (حفظ جديد) وتوجيه التسجيل إلى (مراجعة).`
      );
      setValue("log_type", "مراجعة_صغرى");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (data.assistant_name && typeof window !== "undefined") {
      localStorage.setItem("quran_tracker_last_assistant_name", data.assistant_name.trim());
    }

    const payload: MemorizationLogInput = {
      ...data,
      student_id: studentId,
      surah_end: isCrossSurah ? data.surah_end : data.surah_start,
      surahs: [data.surah_start, ...(isCrossSurah && data.surah_end !== data.surah_start ? [data.surah_end] : [])],
    };

    const res = await createMemorizationLog(payload);

    if (res.success && res.data) {
      successHaptic();
      reset();
      onSuccess?.(res.data);
      onClose();
    } else {
      warningHaptic();
      setError(res.error || "فشل حفظ التسميع");
    }
    setIsLoading(false);
  };

  const logTypes: Array<{ value: LogTypeEnum; label: string }> = [
    { value: "جديد", label: "حفظ جديد" },
    { value: "مراجعة_صغرى", label: "مراجعة صغرى" },
    { value: "مراجعة_كبرى", label: "مراجعة كبرى" },
  ];

  const grades: Array<{ value: EvaluationGradeEnum; label: string }> = [
    { value: "ممتاز", label: "ممتاز 🌟" },
    { value: "جيد_جدا", label: "جيد جداً 👍" },
    { value: "جيد", label: "جيد 👌" },
    { value: "يحتاج_تحسين", label: "يحتاج تحسين ⚠️" },
  ];

  const pagePresets = [
    { label: "¼ صفحة", value: 0.25 },
    { label: "½ صفحة", value: 0.5 },
    { label: "صفحة واحدة", value: 1.0 },
    { label: "صفحتان", value: 2.0 },
    { label: "5 صفحات", value: 5.0 },
    { label: "10 صفحات", value: 10.0 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto">
        {/* Dedicated Header Section */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-base">
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>تسجيل تسميع جديد 📖</span>
            </div>
            {studentName && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                الطالب: <span className="font-bold text-slate-700 dark:text-slate-300">{studentName}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container wrapping body & footer */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden" autoComplete="off" noValidate>
          {/* Optimized Compact Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            {/* Assistant / Supervisor Name Input */}
            <div className="space-y-1">
              <Label htmlFor="assistant_name" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>اسم المشرف / المساعد (اختياري)</span>
              </Label>
              <Input
                id="assistant_name"
                placeholder="مثال: أستاذ أحمد المحمود"
                className="h-9 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                {...register("assistant_name")}
              />
            </div>

            {/* Log Type Selection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">نوع التسميع</Label>
                {isSurahAlreadyMemorized && (
                  <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800">
                    🔒 مقفل للحفظ الجديد
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {logTypes.map((type) => {
                  const isNewTypeLocked = type.value === "جديد" && isSurahAlreadyMemorized;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      disabled={isNewTypeLocked}
                      onClick={() => {
                        if (!isNewTypeLocked) {
                          lightHaptic();
                          setValue("log_type", type.value);
                        } else {
                          warningHaptic();
                        }
                      }}
                      title={isNewTypeLocked ? "تم حفظ هذه السورة مسبقاً لهذا الطالب" : type.label}
                      className={`py-2 px-1.5 text-xs font-bold rounded-xl border transition-all text-center ${
                        isNewTypeLocked
                          ? "opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through"
                          : selectedLogType === type.value
                          ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surah & Ayah Selection */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1">
                <Label htmlFor="primary_surah" className="text-xs font-bold text-teal-900 dark:text-teal-300">
                  اختر السورة *
                </Label>
                <select
                  id="primary_surah"
                  value={selectedSurahStart}
                  onChange={(e) => handlePrimarySurahChange(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  {QURAN_SURAHS.map((s) => {
                    const isMem = memorizedSurahsMap.has(normalizeSurahName(s.name));
                    return (
                      <option key={s.number} value={s.name}>
                        {isMem ? `✅ ${s.number}. سورة ${s.name} (تم الحفظ)` : `${s.number}. سورة ${s.name} (${s.numberOfAyahs} آية)`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Streamlined inline layout for من آية and إلى آية */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="aya_start" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    من آية
                  </Label>
                  <Input
                    id="aya_start"
                    type="number"
                    min={1}
                    className="h-9 font-mono text-center font-bold text-xs rounded-xl bg-white dark:bg-slate-900"
                    autoComplete="off"
                    {...register("aya_start", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="aya_end" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    إلى آية
                  </Label>
                  <Input
                    id="aya_end"
                    type="number"
                    min={1}
                    className="h-9 font-mono text-center font-bold text-xs rounded-xl bg-white dark:bg-slate-900"
                    autoComplete="off"
                    {...register("aya_end", { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Optional Cross-Surah Toggle */}
              <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={isCrossSurah}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsCrossSurah(checked);
                      if (!checked) {
                        setValue("surah_end", selectedSurahStart);
                        const surahObj = QURAN_SURAHS.find((s) => s.name === selectedSurahStart);
                        if (surahObj) {
                          setValue("aya_end", surahObj.numberOfAyahs);
                        }
                      }
                    }}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span>تسميع ممتد بين سورين مختلفين</span>
                </label>

                {isCrossSurah && (
                  <div className="space-y-1 mt-1.5 animate-in fade-in duration-200">
                    <Label htmlFor="surah_end" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      السورة المنتهية عندها (إلى سورة)
                    </Label>
                    <select
                      id="surah_end"
                      className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-bold"
                      {...register("surah_end", {
                        onChange: (e) => {
                          const endName = e.target.value;
                          const endSurahObj = QURAN_SURAHS.find((s) => s.name === endName);
                          if (endSurahObj) {
                            setValue("aya_end", endSurahObj.numberOfAyahs);
                          }
                        },
                      })}
                    >
                      {QURAN_SURAHS.map((s) => {
                        const isMem = memorizedSurahsMap.has(normalizeSurahName(s.name));
                        return (
                          <option key={s.number} value={s.name}>
                            {isMem ? `✅ ${s.number}. سورة ${s.name} (تم الحفظ)` : `${s.number}. سورة ${s.name}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Prominent Amber Warning Box when Surah was previously memorized */}
              {isSurahAlreadyMemorized && selectedSurahRecord && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in fade-in duration-200">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="space-y-1 leading-relaxed">
                    <p>
                      تم حفظ <strong className="text-amber-950 dark:text-amber-100 underline decoration-amber-400 decoration-2 font-black">سورة {selectedSurahRecord.surahName}</strong> مسبقاً بتاريخ (
                      <span className="font-black text-amber-950 dark:text-amber-100">{selectedSurahRecord.formattedDate}</span>).
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 font-medium">
                      تم قفل خيار (حفظ جديد) وتوجيه التسجيل إلى (مراجعة) لمنع تكرار احتساب الصفحات.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Page Count Presets & Precise Input */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Hash className="w-3.5 h-3.5 text-teal-600" />
                <span>كمية التسميع (عدد الصفحات)</span>
              </Label>

              {/* Compact Fractional Page Presets */}
              <div className="grid grid-cols-6 gap-1">
                {pagePresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      lightHaptic();
                      setValue("page_count", preset.value);
                    }}
                    className={`py-1.5 px-1 text-xs font-bold rounded-xl border transition-all text-center ${
                      currentPageCount === preset.value
                        ? "bg-teal-800 text-white border-teal-800 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Integrated Precise Input Box */}
              <div className="flex items-center gap-2 pt-0.5">
                <Label htmlFor="page_count" className="text-xs shrink-0 font-bold text-slate-600 dark:text-slate-300">
                  إدخال دقيق للصفحات:
                </Label>
                <Input
                  id="page_count"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1.0"
                  className="h-8 w-24 font-mono text-center font-bold text-xs rounded-xl bg-white dark:bg-slate-900"
                  autoComplete="off"
                  {...register("page_count", { valueAsNumber: true })}
                />
                <span className="text-xs text-slate-500 font-bold">صفحة</span>
              </div>
            </div>

            {/* Grade Badges (Balanced 2x2 Grid) */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">التقييم والدرجة</Label>
              <div className="grid grid-cols-2 gap-2">
                {grades.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setValue("grade", g.value)}
                    className={`py-2.5 px-2 text-xs font-bold rounded-2xl border transition-all flex items-center justify-center gap-1.5 ${
                      selectedGrade === g.value
                        ? "bg-teal-800 text-white border-teal-800 shadow-md"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher Notes */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                ملاحظات المعلم (اختياري)
              </Label>
              <Input
                id="notes"
                placeholder="مثال: إتقان أحكام النون الساكنة والتنوين"
                className="h-9 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                {...register("notes")}
              />
            </div>
          </div>

          {/* Guaranteed Fixed Footer */}
          <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-3 flex items-center gap-2.5 z-20">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-3 px-5 rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "جاري الحفظ..." : "حفظ التسميع 💾"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 active:scale-[0.98] text-slate-600 font-semibold rounded-2xl transition-all text-sm"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
