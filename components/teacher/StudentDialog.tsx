"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, UserCheck, X, Camera, School, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { studentSchema, StudentInput, ACADEMIC_GRADES } from "@/lib/validations/student";
import { StudentRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage, blobToDataURL } from "@/lib/utils/imageCompressor";

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: "",
      parent_phone: "",
      academic_grade: "",
      school_name: "",
      address: "",
      father_job: "",
      avatar_url: "",
    },
  });

  useEffect(() => {
    if (student) {
      reset({
        full_name: student.full_name,
        parent_phone: student.parent_phone || "",
        academic_grade: student.academic_grade || "",
        school_name: student.school_name || "",
        address: student.address || "",
        father_job: student.father_job || "",
        avatar_url: student.avatar_url || "",
      });
      setAvatarPreview(student.avatar_url || null);
    } else {
      reset({
        full_name: "",
        parent_phone: "",
        academic_grade: "",
        school_name: "",
        address: "",
        father_job: "",
        avatar_url: "",
      });
      setAvatarPreview(null);
    }
  }, [student, reset, isOpen]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setError(null);

      // Compress avatar to max 400x400 HD WEBP (~30-50KB)
      const compressedBlob = await compressImage(file, 400, 0.82);
      const dataUrl = await blobToDataURL(compressedBlob);

      setAvatarPreview(dataUrl);
      setValue("avatar_url", dataUrl);
    } catch {
      setError("فشل ضغط ملف الصورة، يرجى تجربة صورة أخرى");
    } finally {
      setIsCompressing(false);
    }
  };

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
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
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center space-y-2 pb-2">
            <div className="relative w-20 h-20 rounded-full border-2 border-teal-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-md group">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="معاينة الصورة" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-teal-800 dark:text-teal-300">
                  {student?.full_name ? student.full_name.charAt(0) : "📷"}
                </span>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold"
              >
                <Camera className="w-5 h-5" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {isCompressing ? "جاري ضغط الصورة..." : "انقر على الصورة لرفع أو تغيير صورة الطالب (معالجة مضغوطة HD)"}
            </span>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">اسم الطالب الثلاثي *</Label>
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
                placeholder="0781234567 أو 0512345678"
                dir="ltr"
                className="text-left"
                {...register("parent_phone")}
              />
              {errors.parent_phone && (
                <p className="text-xs text-rose-600">{errors.parent_phone.message}</p>
              )}
            </div>
          </div>

          {/* Academic Grade Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="academic_grade" className="flex items-center gap-1 text-xs font-bold">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>الصف الدراسي (اختياري)</span>
            </Label>
            <select
              id="academic_grade"
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              {...register("academic_grade")}
            >
              <option value="">-- اختر الصف الدراسي --</option>
              {ACADEMIC_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          {/* School Name, Address & Father's Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school_name" className="flex items-center gap-1 text-xs font-bold">
                <School className="w-4 h-4 text-teal-600" />
                <span>اسم المدرسة (اختياري)</span>
              </Label>
              <Input
                id="school_name"
                placeholder="مثال: مدرسة الفاروق الثانوية"
                {...register("school_name")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="father_job" className="flex items-center gap-1 text-xs font-bold">
                <Briefcase className="w-4 h-4 text-teal-600" />
                <span>عمل / مهنة الوالد (اختياري)</span>
              </Label>
              <Input
                id="father_job"
                placeholder="مثال: مهندس / معلم / تاجر"
                {...register("father_job")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1 text-xs font-bold">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>مكان السكن / العنوان (اختياري)</span>
            </Label>
            <Input
              id="address"
              placeholder="مثال: عمان - حي الجامعة"
              {...register("address")}
            />
          </div>

          <div className="flex items-center gap-2 pt-2 justify-end border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isCompressing}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || isCompressing} className="gap-2">
              <span>{isLoading ? "جاري الحفظ..." : student ? "تحديث" : "إضافة الطالب"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
