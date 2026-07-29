"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, UserCheck, X } from "lucide-react";
import { studentSchema, StudentInput } from "@/lib/validations/student";
import { StudentRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentInput) => Promise<void>;
  student?: StudentRow | null;
  isLoading?: boolean;
}

export function StudentDialog({
  isOpen,
  onClose,
  onSubmit,
  student,
  isLoading = false,
}: StudentDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: "",
      parent_phone: "",
    },
  });

  useEffect(() => {
    if (student) {
      reset({
        full_name: student.full_name,
        parent_phone: student.parent_phone || "",
      });
    } else {
      reset({
        full_name: "",
        parent_phone: "",
      });
    }
  }, [student, reset, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: StudentInput) => {
    setError(null);
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشلت العملية");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-lg">
            {student ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <span>{student ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="full_name">اسم الطالب الثلاثي</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="مثال: عبد الله محمد الأحمد"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-xs text-rose-600">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_phone">رقم هاتف ولي الأمر (اختياري)</Label>
            <Input
              id="parent_phone"
              type="tel"
              placeholder="0512345678"
              dir="ltr"
              className="text-left"
              {...register("parent_phone")}
            />
            {errors.parent_phone && (
              <p className="text-xs text-rose-600">{errors.parent_phone.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <span>{isLoading ? "جاري الحفظ..." : student ? "تحديث" : "إضافة الطالب"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
