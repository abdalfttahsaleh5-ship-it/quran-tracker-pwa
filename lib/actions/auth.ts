"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, LoginInput, SignupInput } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function loginTeacher(data: LoginInput): Promise<ActionResult> {
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "بيانات الإدخال غير صحيحة",
    };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      return {
        success: false,
        error: "بيانات الدخول غير صحيحة، يرجى التأكد من البريد الإلكتروني وكلمة المرور",
      };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء الدخول",
    };
  }
}

export async function signupTeacher(data: SignupInput): Promise<ActionResult> {
  const validation = signupSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "بيانات الإدخال غير صحيحة",
    };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        data: {
          full_name: validation.data.full_name,
          phone: validation.data.phone || null,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "فشل إنشاء الحساب، قد يكون البريد الإلكتروني مستخدماً بالفعل",
      };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تسجيل الحساب",
    };
  }
}

export async function logoutTeacher(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
