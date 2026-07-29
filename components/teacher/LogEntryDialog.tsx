"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, X, CheckCircle2 } from "lucide-react";
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
    },
  });

  const selectedLogType = watch("log_type");
  const selectedGrade = watch("grade");

  if (!isOpen) return null;

  const handleFormSubmit = async (data: MemorizationLogInput) => {
    setIsLoading(true);
    setError(null);

    const res = await createMemorizationLog({
      ...data,
      student_id: studentId,
    });

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
            {errors.log_type && (
              <p className="text-xs text-rose-600">{errors.log_type.message}</p>
            )}
          </div>

          {/* Surah & Verse Selection Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* From Surah & Aya */}
            <div className="space-y-3">
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
                      {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
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

            {/* To Surah & Aya */}
            <div className="space-y-3">
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
                      {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
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
            {errors.grade && (
              <p className="text-xs text-rose-600">{errors.grade.message}</p>
            )}
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
