"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, X, CheckCircle2 } from "lucide-react";
import { attendanceSchema, AttendanceInput } from "@/lib/validations/log";
import { recordAttendance } from "@/lib/actions/attendance";
import { AttendanceStatusEnum } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export function AttendanceDialog({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSuccess,
}: AttendanceDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AttendanceInput>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      student_id: studentId,
      date: todayStr,
      status: "حاضر",
      notes: "",
    },
  });

  const selectedStatus = watch("status");

  if (!isOpen) return null;

  const handleFormSubmit = async (data: AttendanceInput) => {
    setIsLoading(true);
    setError(null);

    const res = await recordAttendance({
      ...data,
      student_id: studentId,
    });

    if (res.success) {
      reset();
      onSuccess?.();
      onClose();
    } else {
      setError(res.error || "فشل تسجيل الحضور");
    }
    setIsLoading(false);
  };

  const statuses: Array<{ value: AttendanceStatusEnum; label: string; activeColor: string }> = [
    { value: "حاضر", label: "حاضر ✅", activeColor: "bg-emerald-700 text-white border-emerald-700" },
    { value: "غائب", label: "غائب ❌", activeColor: "bg-rose-700 text-white border-rose-700" },
    { value: "مستأذن", label: "مستأذن 📄", activeColor: "bg-amber-700 text-white border-amber-700" },
    { value: "متأخر", label: "متأخر ⏰", activeColor: "bg-orange-700 text-white border-orange-700" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-lg">
            <Calendar className="w-5 h-5" />
            <span>تسجيل حضور الطالب: {studentName}</span>
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
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="attendance-date">التاريخ</Label>
            <Input
              id="attendance-date"
              type="date"
              {...register("date")}
            />
            {errors.date && (
              <p className="text-xs text-rose-600">{errors.date.message}</p>
            )}
          </div>

          {/* Status Options */}
          <div className="space-y-2">
            <Label>حالة الحضور</Label>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setValue("status", st.value)}
                  className={`py-3 px-3 text-sm font-bold rounded-xl border transition-all text-center ${
                    selectedStatus === st.value
                      ? `${st.activeColor} shadow-md`
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
            {errors.status && (
              <p className="text-xs text-rose-600">{errors.status.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="attendance-notes">ملاحظات الحضور (اختياري)</Label>
            <Input
              id="attendance-notes"
              placeholder="مثال: تأخر 15 دقيقة بسبب ظروف السير"
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
              <span>{isLoading ? "جاري الحفظ..." : "تأكيد الحضور"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
