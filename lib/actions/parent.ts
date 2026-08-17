"use server";

import { createClient } from "@/lib/supabase/server";
import { ParentProgressPayload } from "@/types";

/**
 * Fetches complete student progress for parent portal via Postgres RPC get_student_progress_by_token
 */
export async function getStudentProgressByToken(token: string): Promise<ParentProgressPayload> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return { success: false, error: "الرابط غير صحيح أو مفقود" };
  }

  const cleanToken = token.trim();

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(cleanToken)) {
    return { success: false, error: "الرمز غير صالح أو غير موجود" };
  }

  try {
    const supabase = createClient();

    // Call Postgres RPC get_student_progress_by_token
    const { data, error } = await supabase.rpc("get_student_progress_by_token", {
      p_token: cleanToken,
    });

    if (error) {
      return {
        success: false,
        error: "فشل استرداد بيانات الطالب: " + error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "الرمز غير صالح أو غير موجود",
      };
    }

    const payload = data as unknown as ParentProgressPayload;

    if (!payload.success || !payload.student) {
      return {
        success: false,
        error: payload.error || "الرمز غير صالح أو تم حذف بيانات الطالب",
      };
    }

    return {
      success: true,
      student: payload.student,
      logs: payload.logs || [],
      attendance: payload.attendance || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء تحميل بيانات الطالب",
    };
  }
}
