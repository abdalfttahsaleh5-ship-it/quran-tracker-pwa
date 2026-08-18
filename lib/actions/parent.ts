"use server";

import { createClient } from "@/lib/supabase/server";
import { ParentProgressPayload } from "@/types";
import { checkRateLimit } from "@/lib/rateLimit";

export interface ParentSearchResult {
  success: boolean;
  token?: string;
  students?: Array<{ id: string; full_name: string; parent_token: string }>;
  error?: string;
}

/**
 * Secure student lookup by parent phone number with sliding window rate limiting,
 * bot timing mitigation delay, phone sanitization, and uniform error handling.
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

  // 2. Enforce intentional delay to thwart high-speed enumeration and brute-force bots
  await new Promise((resolve) => setTimeout(resolve, 600));

  // 3. Normalize and sanitize incoming phone string
  if (!input || typeof input !== "string" || input.trim() === "") {
    return {
      success: false,
      error: "يرجى إدخال رقم الهاتف المسجل",
    };
  }

  // Convert Eastern Arabic numerals (٠-٩) to Western (0-9) and strip non-digits
  const westernized = input.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  const cleanDigits = westernized.replace(/\D/g, "");

  // Enforce minimum length of 9 digits
  if (cleanDigits.length < 9) {
    return {
      success: false,
      error: "رقم الهاتف غير صحيح أو غير مسجل في كشوفات الحلقة",
    };
  }

  // 4. Database query and uniform generic response handling
  try {
    const supabase = createClient();
    const last9 = cleanDigits.slice(-9);

    // Query students matching full clean digits or last 9 digits suffix
    const { data: students, error } = await supabase
      .from("students")
      .select("id, full_name, parent_token, parent_phone")
      .or(`parent_phone.eq.${cleanDigits},parent_phone.ilike.%${last9}%`);

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
