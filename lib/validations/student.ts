import { z } from "zod";

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
    .trim(),
  parent_phone: z
    .string()
    .regex(/^(05|5|\+9665)[0-9]{8}$/, { message: "رقم الهاتف غير صحيح (مثال: 0512345678)" })
    .or(z.literal(""))
    .nullable()
    .optional(),
  notes: z.string().max(500, { message: "الملاحظات يجب أن لا تتجاوز 500 حرف" }).nullable().optional(),
});

export type StudentInput = z.infer<typeof studentSchema>;
