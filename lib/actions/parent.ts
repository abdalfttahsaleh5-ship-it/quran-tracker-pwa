"use server";

import { createClient } from "@/lib/supabase/server";
import { ParentProgressPayload } from "@/types";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateAndFormatJordanianPhone } from "@/lib/phoneUtils";

export interface ParentSearchResult {
  success: boolean;
  token?: string;
  students?: Array<{ id: string; full_name: string; parent_token: string }>;
  error?: string;
}

/**
 * Secure student lookup by parent phone number with sliding window rate limiting,
 * bot timing mitigation delay, strict Jordanian phone normalization, safe parameterized .in() query,
 * and uniform error handling.
 */
export async function findStudentByPhoneOrCode(input: string): Promise<ParentSearchResult> {
  // 1. IP-based sliding window rate-limiting check (5 attempts / 15 minutes)
  const rateLimitResult = checkRateLimit("parent_lookup", 5, 15 * 60 * 1000);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: rateLimitResult.error || "تم تجاوز الحد المسموح به من المحاولات. يرجى المحاولة بعد 15 دقيقة.",
    };
  }

  // 2. Enforce intentional delay to thwart high-speed automated enumeration bots
  await new Promise((resolve) => setTimeout(resolve, 600));

  // 3. Pre-query validation: Strict Jordanian phone format check
  const phoneValidation = validateAndFormatJordanianPhone(input);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      error: phoneValidation.error || "يرجى إدخال رقم هاتف أردني صحيح (مثال: 0791234567 أو +962791234567)",
    };
  }

  // 4. Safe parameterized query using .in() to eliminate PostgREST filter injection
  try {
    const supabase = createClient();

    const { data: students, error } = await supabase
      .from("students")
      .select("id, full_name, parent_token, parent_phone")
      .in("parent_phone", phoneValidation.variations);

    if (error || !students || students.length === 0) {
      return {
        success: false,
        error: "رقم الهاتف غير مسجل في كشوفات الحلقة، يرجى التواصل مع المعلم",
      };
    }

    if (students.length === 1) {
      return {
        success: true,
        token: students[0].parent_token,
      };
    }

    return {
      success: true,
      students: students.map((st) => ({
        id: st.id,
        full_name: st.full_name,
        parent_token: st.parent_token,
      })),
    };
  } catch {
    // Uniform generic error to prevent database/internal detail leakage
    return {
      success: false,
      error: "حدث خطأ غير متوقع أثناء البحث، يرجى المحاولة لاحقاً",
    };
  }
}

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
