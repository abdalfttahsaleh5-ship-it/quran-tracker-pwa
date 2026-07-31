"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, X, CheckCircle2, UserCheck, Hash, ChevronDown } from "lucide-react";
import { memorizationLogSchema, MemorizationLogInput } from "@/lib/validations/log";
import { createMemorizationLog } from "@/lib/actions/log";
import { QURAN_SURAHS } from "@/lib/constants/quran";
import { LogTypeEnum, EvaluationGradeEnum, MemorizationLogRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LogEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess?: (log: MemorizationLogRow) => void;
}

export function LogEntryDialog({
  isOpen,
  onClose,
  studentId,
  studentName,
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

  // Automatically update page_count when surah, ayah, or cross-surah state changes
  useEffect(() => {
    if (!selectedSurahStart) return;

    const fromSurah = QURAN_SURAHS.find((s) => s.name === selectedSurahStart);
    const targetSurahName = isCrossSurah ? (selectedSurahEnd || selectedSurahStart) : selectedSurahStart;
    const toSurah = QURAN_SURAHS.find((s) => s.name === targetSurahName);

    if (!fromSurah || !toSurah) return;

    const fromAyah = Number(selectedAyaStart) || 1;
    const toAyah = Number(selectedAyaEnd) || 1;

    let calculatedPages = 1;

    if (fromSurah.id === toSurah.id) {
      const totalSurahPages = fromSurah.endPage - fromSurah.startPage + 1;
      const validFrom = Math.max(1, Math.min(fromAyah, fromSurah.numberOfAyahs));
      const validTo = Math.max(1, Math.min(toAyah, fromSurah.numberOfAyahs));
      const ayahsCount = Math.max(1, validTo - validFrom + 1);
      const rawPages = (ayahsCount / fromSurah.numberOfAyahs) * totalSurahPages;

      if (rawPages >= 1) {
        calculatedPages = Math.max(1, Math.round(rawPages));
      } else {
        const roundedFraction = Math.round(rawPages * 4) / 4;
        calculatedPages = Math.max(0.25, roundedFraction);
      }
    } else {
      // Cross-surah page calculation using QURAN_SURAHS startPage & ayah offsets:
      // Start Page = fromSurah.startPage + fractional offset based on from_ayah
      // End Page = toSurah.startPage + fractional offset based on to_ayah
      const validFrom = Math.max(1, Math.min(fromAyah, fromSurah.numberOfAyahs));
      const validTo = Math.max(1, Math.min(toAyah, toSurah.numberOfAyahs));

      const fromOffset = (validFrom - 1) / fromSurah.numberOfAyahs;
      const startPage = fromSurah.startPage + fromOffset;

      const toOffset = validTo / toSurah.numberOfAyahs;
      const endPage = toSurah.startPage + toOffset;

      const diff = Math.abs(endPage - startPage);
      calculatedPages = Math.max(0.25, Math.round(diff));
    }

    setValue("page_count", calculatedPages);
  }, [selectedSurahStart, selectedSurahEnd, selectedAyaStart, selectedAyaEnd, isCrossSurah, setValue]);

  // Auto-fill verse range upon selecting primary surah
  const handlePrimarySurahChange = (surahName: string) => {
    setValue("surah_start", surahName);
    if (!isCrossSurah) {
      setValue("surah_end", surahName);
    }
    const surahObj = QURAN_SURAHS.find((s) => s.name === surahName);
    if (surahObj) {
      setValue("aya_start", 1);
      setValue("aya_end", surahObj.numberOfAyahs);
    }
  };

  if (!isOpen) return null;

  const handleFormSubmit = async (data: MemorizationLogInput) => {
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
      reset();
      onSuccess?.(res.data);
      onClose();
    } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Dedicated Header Section */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-base sm:text-lg">
              <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container wrapping body & footer */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden" noValidate>
          {/* Optimized Compact Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm rounded-2xl border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            {/* Assistant / Supervisor Name Input */}
            <div className="space-y-1.5">
              <Label htmlFor="assistant_name" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>اسم المشرف / المساعد (اختياري)</span>
              </Label>
              <Input
                id="assistant_name"
                placeholder="مثال: أستاذ أحمد المحمود"
                className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                {...register("assistant_name")}
              />
            </div>

            {/* Log Type Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">نوع التسميع</Label>
              <div className="grid grid-cols-3 gap-2">
                {logTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue("log_type", type.value)}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      selectedLogType === type.value
                        ? "bg-teal-700 text-white border-teal-700 shadow-sm scale-[1.01]"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Surah & Ayah Selection */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1">
                <Label htmlFor="primary_surah" className="text-xs font-bold text-teal-900 dark:text-teal-300">
                  اختر السورة *
                </Label>
                <select
                  id="primary_surah"
                  value={selectedSurahStart}
                  onChange={(e) => handlePrimarySurahChange(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.number} value={s.name}>
                      {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                    </option>
                  ))}
                </select>
              </div>

              {/* Streamlined inline layout for من آية and إلى آية */}
              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <div className="space-y-1">
                  <Label htmlFor="aya_start" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    من آية
                  </Label>
                  <Input
                    id="aya_start"
                    type="number"
                    min={1}
                    className="h-10 font-mono text-center font-bold text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900"
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
                    className="h-10 font-mono text-center font-bold text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900"
                    {...register("aya_end", { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Optional Cross-Surah Toggle */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
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
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>تسميع ممتد بين سورين مختلفين</span>
                </label>

                {isCrossSurah && (
                  <div className="space-y-1 mt-2 animate-in fade-in duration-200">
                    <Label htmlFor="surah_end" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      السورة المنتهية عندها (إلى سورة)
                    </Label>
                    <select
                      id="surah_end"
                      className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm font-bold"
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
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.number} value={s.name}>
                          {s.number}. سورة {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Page Count Presets & Precise Input */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Hash className="w-4 h-4 text-teal-600" />
                <span>كمية التسميع (عدد الصفحات)</span>
              </Label>

              {/* Compact Fractional Page Presets */}
              <div className="grid grid-cols-6 gap-1.5">
                {pagePresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setValue("page_count", preset.value)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center ${
                      currentPageCount === preset.value
                        ? "bg-teal-800 text-white border-teal-800 shadow-sm scale-105"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Integrated Precise Input Box */}
              <div className="flex items-center gap-2 pt-1">
                <Label htmlFor="page_count" className="text-xs shrink-0 font-bold text-slate-600 dark:text-slate-300">
                  إدخال دقيق للصفحات:
                </Label>
                <Input
                  id="page_count"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1.0"
                  className="h-9 w-28 font-mono text-center font-bold text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900"
                  {...register("page_count", { valueAsNumber: true })}
                />
                <span className="text-xs text-slate-500 font-bold">صفحة</span>
              </div>
            </div>

            {/* Grade Badges (Balanced 2x2 Grid) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">التقييم والدرجة</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {grades.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setValue("grade", g.value)}
                    className={`py-3 px-3 text-xs sm:text-sm font-bold rounded-2xl border transition-all flex items-center justify-center gap-1.5 ${
                      selectedGrade === g.value
                        ? "bg-teal-800 text-white border-teal-800 shadow-md scale-[1.02]"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                ملاحظات المعلم (اختياري)
              </Label>
              <Input
                id="notes"
                placeholder="مثال: إتقان أحكام النون الساكنة والتنوين"
                className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                {...register("notes")}
              />
            </div>
          </div>

          {/* Permanent Sticky Action Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3 z-30">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "جاري الحفظ..." : "حفظ التسميع 💾"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 active:scale-[0.98] text-slate-600 font-semibold rounded-2xl transition-all text-sm sm:text-base"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
