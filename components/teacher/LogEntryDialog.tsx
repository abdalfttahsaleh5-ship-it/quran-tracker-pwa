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
  const selectedLogType = watch("log_type");
  const selectedGrade = watch("grade");
  const currentPageCount = watch("page_count");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-lg">
            <BookOpen className="w-5 h-5" />
            <span>تسجيل تسميع جديد للطالب: {studentName}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
          {/* Assistant Name Input Field */}
          <div className="space-y-1.5">
            <Label htmlFor="assistant_name" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>اسم المشرف / المساعد (اختياري)</span>
            </Label>
            <Input
              id="assistant_name"
              placeholder="مثال: أستاذ أحمد المحمود"
              {...register("assistant_name")}
            />
          </div>

          {/* Log Type Selection */}
          <div className="space-y-1.5">
            <Label>نوع التسميع</Label>
            <div className="grid grid-cols-3 gap-2">
              {logTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setValue("log_type", type.value)}
                  className={`py-2 px-3 text-sm font-bold rounded-xl border transition-all text-center ${
                    selectedLogType === type.value
                      ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Unified Primary Surah Selection & Compact Ayah Range */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <Label htmlFor="primary_surah" className="text-xs font-bold text-teal-900 dark:text-teal-300">
                اختر السورة *
              </Label>
              <select
                id="primary_surah"
                value={selectedSurahStart}
                onChange={(e) => handlePrimarySurahChange(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-bold text-slate-800 dark:text-slate-100"
              >
                {QURAN_SURAHS.map((s) => (
                  <option key={s.number} value={s.name}>
                    {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                  </option>
                ))}
              </select>
            </div>

            {/* Compact Side-by-Side Ayah Range Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="aya_start" className="text-xs font-bold">من آية</Label>
                <Input
                  id="aya_start"
                  type="number"
                  min={1}
                  className="font-mono text-center font-bold"
                  {...register("aya_start", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="aya_end" className="text-xs font-bold">إلى آية</Label>
                <Input
                  id="aya_end"
                  type="number"
                  min={1}
                  className="font-mono text-center font-bold"
                  {...register("aya_end", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Optional Cross-Surah Toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={isCrossSurah}
                  onChange={(e) => {
                    setIsCrossSurah(e.target.checked);
                    if (!e.target.checked) {
                      setValue("surah_end", selectedSurahStart);
                    }
                  }}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>تسميع ممتد بين سورين مختلفين</span>
              </label>

              {isCrossSurah && (
                <div className="space-y-1 mt-2 animate-in fade-in duration-200">
                  <Label htmlFor="surah_end" className="text-xs font-bold">السورة المنتهية عندها (إلى سورة)</Label>
                  <select
                    id="surah_end"
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-bold"
                    {...register("surah_end")}
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

          {/* Page Quantity / Fraction Buttons Section */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Hash className="w-4 h-4 text-teal-600" />
              <span>كمية التسميع (عدد الصفحات)</span>
            </Label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
              {pagePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setValue("page_count", preset.value)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                    currentPageCount === preset.value
                      ? "bg-teal-800 text-white border-teal-800 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Label htmlFor="page_count" className="text-xs shrink-0 font-bold">
                أدخل كسر/عدد الصفحات بدقة:
              </Label>
              <Input
                id="page_count"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="1.0"
                className="w-32 font-mono text-center font-bold"
                {...register("page_count", { valueAsNumber: true })}
              />
              <span className="text-xs text-slate-500 font-bold">صفحة</span>
            </div>
          </div>

          {/* Grade Selection */}
          <div className="space-y-2">
            <Label>التقييم والدرجة</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {grades.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setValue("grade", g.value)}
                  className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                    selectedGrade === g.value
                      ? "bg-teal-800 text-white border-teal-800 shadow-md"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">ملاحظات المعلم (اختياري)</Label>
            <Input
              id="notes"
              placeholder="مثال: إتقان أحكام النون الساكنة والتنوين"
              {...register("notes")}
            />
          </div>

          {/* Submit Row */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? "جاري الحفظ..." : "حفظ التسميع"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
