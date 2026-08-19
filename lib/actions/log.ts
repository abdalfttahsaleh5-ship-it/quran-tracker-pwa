"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { memorizationLogSchema, MemorizationLogInput } from "@/lib/validations/log";
import { MemorizationLogRow, MemorizationLogInsert, MemorizationLogUpdate } from "@/types";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new memorization log for a student.
 * - Preserves `teacher_id: user.id` for backward compatibility.
 * - Authorization is enforced via Supabase RLS:
 *   authenticated user -> student_id -> students.group_id -> group_members -> RLS
 */
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

    const insertPayload: MemorizationLogInsert = {
      student_id: validation.data.student_id,
      teacher_id: user.id,
      log_type: validation.data.log_type,
      surah_start: validation.data.surah_start,
      aya_start: validation.data.aya_start,
      surah_end: validation.data.surah_end,
      aya_end: validation.data.aya_end,
      grade: validation.data.grade,
      notes: validation.data.notes || null,
      assistant_name: validation.data.assistant_name || null,
      page_count: validation.data.page_count ?? null,
      surahs: validation.data.surahs || null,
      audio_url: validation.data.audio_url || null,
    };

    const { data: newLog, error } = await supabase
      .from("memorization_logs")
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
    revalidatePath("/students");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: newLog,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إضافة التسميع",
    };
  }
}

/**
 * Updates an existing memorization log by ID.
 * - Authorization is enforced via Supabase RLS based on group membership.
 * - Does not allow modifying `student_id` or bypassing group boundaries.
 */
export async function updateMemorizationLog(
  id: string,
  data: MemorizationLogInput
): Promise<ActionResult<MemorizationLogRow>> {
  if (!id) {
    return { success: false, error: "معرف السجل مطلوب للتعديل" };
  }

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
        error: "غير مصرح لك بتعديل السجل، يرجى تسجيل الدخول",
      };
    }

    const updatePayload: MemorizationLogUpdate = {
      log_type: validation.data.log_type,
      surah_start: validation.data.surah_start,
      aya_start: validation.data.aya_start,
      surah_end: validation.data.surah_end,
      aya_end: validation.data.aya_end,
      grade: validation.data.grade,
      notes: validation.data.notes || null,
      assistant_name: validation.data.assistant_name || null,
      page_count: validation.data.page_count ?? null,
      surahs: validation.data.surahs || null,
      ...(validation.data.audio_url ? { audio_url: validation.data.audio_url } : {}),
    };

    const { data: updatedLog, error } = await supabase
      .from("memorization_logs")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "فشل تحديث التسميع: " + error.message,
      };
    }

    revalidatePath(`/students/${validation.data.student_id}`);
    revalidatePath("/students");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: updatedLog,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تحديث التسميع",
    };
  }
}

/**
 * Fetches recent memorization logs for a given student.
 * - Queries by student_id and relies on Supabase RLS to verify group membership.
 * - Allows all teachers and assistants in the student's group to read logs.
 */
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
      data: logs || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء جلب السجلات",
    };
  }
}

/**
 * Deletes a memorization log by ID.
 * - Authorization is enforced via Supabase RLS based on group membership.
 */
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
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "فشل حذف السجل: " + error.message,
      };
    }

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حذف السجل",
    };
  }
}

export const getStudentLogsCached = cache(getStudentLogs);
