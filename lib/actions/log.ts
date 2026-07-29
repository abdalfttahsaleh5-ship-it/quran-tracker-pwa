"use server";

import { createClient } from "@/lib/supabase/server";
import { memorizationLogSchema, MemorizationLogInput } from "@/lib/validations/log";
import { MemorizationLogRow } from "@/types";
import { Database } from "@/types/database";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createMemorizationLog(data: MemorizationLogInput): Promise<ActionResult<MemorizationLogRow>> {
  const validation = memorizationLogSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "بيانات التسميع غير صحيحة",
    };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "غير مصرح لك بإضافة تسميع، يرجى تسجيل الدخول",
      };
    }

    const insertPayload: Database["public"]["Tables"]["memorization_logs"]["Insert"] = {
      student_id: validation.data.student_id,
      teacher_id: user.id,
      log_type: validation.data.log_type,
      surah_start: validation.data.surah_start,
      aya_start: validation.data.aya_start,
      surah_end: validation.data.surah_end,
      aya_end: validation.data.aya_end,
      grade: validation.data.grade,
      notes: validation.data.notes || null,
    };

    const { data: newLog, error } = await (supabase.from("memorization_logs") as ReturnType<typeof supabase.from>)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "فشل حفظ التسميع: " + error.message,
      };
    }

    revalidatePath(`/students/${validation.data.student_id}`);
    revalidatePath("/dashboard");
    return {
      success: true,
      data: newLog as MemorizationLogRow,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إضافة التسميع",
    };
  }
}

export async function getStudentLogs(
  studentId: string,
  limit: number = 50
): Promise<ActionResult<MemorizationLogRow[]>> {
  if (!studentId) {
    return { success: false, error: "معرف الطالب مطلوب" };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "غير مصرح لك للوصول إلى السجلات",
      };
    }

    const { data: logs, error } = await supabase
      .from("memorization_logs")
      .select("*")
      .eq("student_id", studentId)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: "فشل جلب سجلات التسميع: " + error.message,
      };
    }

    return {
      success: true,
      data: (logs || []) as MemorizationLogRow[],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء جلب السجلات",
    };
  }
}

export async function deleteMemorizationLog(id: string, studentId: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "معرف السجل مطلوب" };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "غير مصرح لك بحذف السجل",
      };
    }

    const { error } = await supabase
      .from("memorization_logs")
      .delete()
      .eq("id", id)
      .eq("teacher_id", user.id);

    if (error) {
      return {
        success: false,
        error: "فشل حذف السجل: " + error.message,
      };
    }

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حذف السجل",
    };
  }
}
