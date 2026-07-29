import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "البريد الإلكتروني مطلوب" })
    .email({ message: "صيغة البريد الإلكتروني غير صحيحة" })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف" }),
});

export const signupSchema = z.object({
  full_name: z
    .string()
    .min(3, { message: "الاسم الكامل يجب أن يكون 3 أحرف على الأقل" })
    .max(100, { message: "الاسم طويل جداً" })
    .trim(),
  email: z
    .string()
    .min(1, { message: "البريد الإلكتروني مطلوب" })
    .email({ message: "صيغة البريد الإلكتروني غير صحيحة" })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف" }),
  phone: z
    .string()
    .regex(/^(\+?|00)[0-9]{8,15}$/, { message: "رقم الجوال غير صحيح (مثال: 0781234567 أو 0512345678)" })
    .or(z.literal(""))
    .nullable()
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
