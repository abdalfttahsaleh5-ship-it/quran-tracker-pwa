import { z } from "zod";

const logTypeEnum = z.enum(["جديد", "مراجعة_صغرى", "مراجعة_كبرى"], {
  errorMap: () => ({ message: "يرجى اختيار نوع التسميع" }),
});

const evaluationGradeEnum = z.enum(["ممتاز", "جيد_جدا", "جيد", "يحتاج_تحسين"], {
  errorMap: () => ({ message: "يرجى اختيار تقييم صحيح" }),
});

const attendanceStatusEnum = z.enum(["حاضر", "غائب", "مستأذن", "متأخر", "لم يرصد"], {
  errorMap: () => ({ message: "يرجى اختيار حالة حضور صحيحة" }),
});

export const memorizationLogSchema = z.object({
  student_id: z.string().uuid({ message: "معرف الطالب غير صحيح" }),
  log_type: logTypeEnum,
  surah_start: z.string().min(1, { message: "يرجى اختيار سورة البداية" }),
  aya_start: z.number().min(1, { message: "آية البداية يجب أن تكون 1 أو أكثر" }),
  surah_end: z.string().min(1, { message: "يرجى اختيار سورة النهاية" }),
  aya_end: z.number().min(1, { message: "آية النهاية يجب أن تكون 1 أو أكثر" }),
  grade: evaluationGradeEnum,
  notes: z.string().max(500, { message: "الملاحظات يجب أن لا تتجاوز 500 حرف" }).nullable().optional(),
  assistant_name: z.string().max(100, { message: "اسم المسمّع طويل جداً" }).nullable().optional(),
  page_count: z.number().min(0, { message: "عدد الصفحات يجب أن يكون 0 أو أكثر" }).nullable().optional(),
  surahs: z.array(z.string()).nullable().optional(),
  audio_url: z.string().nullable().optional(),
});

export const attendanceSchema = z.object({
  student_id: z.string().uuid({ message: "معرف الطالب غير صحيح" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "تاريخ غير صحيح" }),
  status: attendanceStatusEnum,
  notes: z.string().max(500).nullable().optional(),
});

export type MemorizationLogInput = z.infer<typeof memorizationLogSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
