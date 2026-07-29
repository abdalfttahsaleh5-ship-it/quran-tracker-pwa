"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, X, CheckCircle2, UserCheck, Layers, Hash } from "lucide-react";
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
  const [selectedSurahs, setSelectedSurahs] = useState<string[]>(["الفاتحة"]);
  const [isMultiSurahOpen, setIsMultiSurahOpen] = useState(false);

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
      surahs: ["الفاتحة"],
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

  const selectedLogType = watch("log_type");
  const selectedGrade = watch("grade");
  const currentPageCount = watch("page_count");

  if (!isOpen) return null;

  const toggleSurahSelection = (surahName: string) => {
    setSelectedSurahs((prev) => {
      let updated: string[];
      if (prev.includes(surahName)) {
        updated = prev.filter((s) => s !== surahName);
        if (updated.length === 0) updated = [surahName]; // at least one surah
      } else {
        updated = [...prev, surahName];
      }

      setValue("surahs", updated);
      setValue("surah_start", updated[0]);
      setValue("surah_end", updated[updated.length - 1]);
      return updated;
    });
  };

  const handleFormSubmit = async (data: MemorizationLogInput) => {
    setIsLoading(true);
    setError(null);

    if (data.assistant_name && typeof window !== "undefined") {
      localStorage.setItem("quran_tracker_last_assistant_name", data.assistant_name.trim());
    }

    const payload: MemorizationLogInput = {
      ...data,
      student_id: studentId,
      surahs: selectedSurahs,
      surah_start: selectedSurahs[0] || data.surah_start,
      surah_end: selectedSurahs[selectedSurahs.length - 1] || data.surah_end,
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

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>
          {/* Assistant Name Input Field */}
          <div className="space-y-2">
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
          <div className="space-y-2">
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

          {/* Multi-Surah Selection Section */}
          <div className="space-y-2 bg-teal-50/60 dark:bg-teal-950/40 p-4 rounded-xl border border-teal-100 dark:border-teal-900">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>اختيار السور (تحديد متعدد)</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMultiSurahOpen(!isMultiSurahOpen)}
                className="text-xs text-teal-700 dark:text-teal-300 font-bold"
              >
                {isMultiSurahOpen ? "إخفاء القائمة ▲" : "تعديل السور المحددة ( " + selectedSurahs.length + " سور ) ▼"}
              </Button>
            </div>

            {/* Selected Surahs Badges Summary */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedSurahs.map((surah) => (
                <span
                  key={surah}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-800 text-white flex items-center gap-1 shadow-xs"
                >
                  <span>سورة {surah}</span>
                  {selectedSurahs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleSurahSelection(surah)}
                      className="hover:text-rose-300 mr-1"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Expandable Surahs Checklist */}
            {isMultiSurahOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-teal-200/60 dark:border-teal-800 max-h-48 overflow-y-auto p-1">
                {QURAN_SURAHS.map((s) => {
                  const isChecked = selectedSurahs.includes(s.name);
                  return (
                    <button
                      key={s.number}
                      type="button"
                      onClick={() => toggleSurahSelection(s.name)}
                      className={`p-2 rounded-lg text-xs font-bold text-right flex items-center justify-between border transition-all ${
                        isChecked
                          ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-teal-50"
                      }`}
                    >
                      <span>{s.number}. {s.name}</span>
                      {isChecked && <span className="font-mono text-amber-300">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Surah Verse Range (Start & End) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-bold">من (البداية)</Label>
              <div>
                <Label htmlFor="surah_start" className="text-xs">السورة</Label>
                <select
                  id="surah_start"
                  className="w-full h-10 mt-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                  {...register("surah_start")}
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.number} value={s.name}>
                      {s.number}. سورة {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="aya_start" className="text-xs">رقم الآية</Label>
                <Input
                  id="aya_start"
                  type="number"
                  min={1}
                  className="mt-1"
                  {...register("aya_start", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-bold">إلى (النهاية)</Label>
              <div>
                <Label htmlFor="surah_end" className="text-xs">السورة</Label>
                <select
                  id="surah_end"
                  className="w-full h-10 mt-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                  {...register("surah_end")}
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.number} value={s.name}>
                      {s.number}. سورة {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="aya_end" className="text-xs">رقم الآية</Label>
                <Input
                  id="aya_end"
                  type="number"
                  min={1}
                  className="mt-1"
                  {...register("aya_end", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Page Quantity / Fraction Buttons Section */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Hash className="w-4 h-4 text-teal-600" />
              <span>كمية التسميع (عدد الصفحات أو أجزاء الصفحة)</span>
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
                className="w-32 font-mono"
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
          <div className="space-y-2">
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
