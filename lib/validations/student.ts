import { z } from "zod";

export const ACADEMIC_GRADES = [
  "الأول الابتدائي",
  "الثاني الابتدائي",
  "الثالث الابتدائي",
  "الرابع الابتدائي",
  "الخامس الابتدائي",
  "السادس الابتدائي",
  "السابع الأساسي",
  "الثامن الأساسي",
  "التاسع الأساسي",
  "العاشر الأساسي",
  "الأول الثانوي (الحادي عشر)",
  "الثاني الثانوي (التوجيهي)",
  "رياض أطفال / روضة",
  "تمهيدي",
  "جامعي",
  "أخرى",
] as const;

export const studentSchema = z.object({
  full_name: z
    .string()
    .min(3, { message: "اسم الطالب يجب أن يكون 3 أحرف على الأقل" })
    .max(100, { message: "اسم الطالب طويل جداً" })
    .trim(),
  parent_name: z
    .string()
    .min(3, { message: "اسم ولي الأمر يجب أن يكون 3 أحرف على الأقل" })
    .max(100, { message: "اسم ولي الأمر طويل جداً" })
    .trim()
    .optional(),
  parent_phone: z
    .string()
    .regex(/^(\+?|00)[0-9]{8,15}$/, { message: "رقم الهاتف غير صحيح (مثال: 0781234567 أو 0512345678)" })
    .or(z.literal(""))
    .nullable()
    .optional(),
  academic_grade: z.string().nullable().optional(),
  school_name: z.string().max(150, { message: "اسم المدرسة طويل جداً" }).nullable().optional(),
  address: z.string().max(200, { message: "العنوان طويل جداً" }).nullable().optional(),
  father_job: z.string().max(150, { message: "اسم المهنة طويل جداً" }).nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  notes: z.string().max(500, { message: "الملاحظات يجب أن لا تتجاوز 500 حرف" }).nullable().optional(),
});

export type StudentInput = z.infer<typeof studentSchema>;
