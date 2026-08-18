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
 * Fetches complete student progress for parent portal.
 * Structured into independent stages:
 * Stage 1: Student data lookup by parent_token
 * Stage 2: Memorization logs lookup (independent; errors do not fail the page)
 * Stage 3: Attendance records lookup (independent; errors do not fail the page)
 */
export async function getStudentProgressByToken(token: string): Promise<ParentProgressPayload> {
  if (!token || typeof token !== "string" || token.trim() === "" || token === "undefined" || token === "null") {
    return {
      success: false,
      error: "الرابط غير صالح أو غير موجود",
      errorCode: "INVALID_TOKEN",
    };
  }

  const cleanToken = decodeURIComponent(token).trim();

  // Validate UUID format strictly (case-insensitive)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(cleanToken)) {
    return {
      success: false,
      error: "الرابط غير صالح أو غير موجود",
      errorCode: "INVALID_TOKEN",
    };
  }

  try {
    const supabase = createClient();

    // ==========================================
    // المرحلة الأولى: استعلام بيانات الطالب الأساسية
    // ==========================================
    const { data: studentRecord, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("parent_token", cleanToken)
      .maybeSingle();

    if (studentError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[getStudentProgressByToken] Student query error:", {
          message: studentError.message,
          code: studentError.code,
          details: studentError.details,
          hint: studentError.hint,
        });
      }
      return {
        success: false,
        error: "تعذر تحميل بعض بيانات الطالب، يرجى المحاولة مرة أخرى.",
        errorCode: "DATABASE_QUERY_ERROR",
      };
    }

    if (!studentRecord) {
      return {
        success: false,
        error: "الرابط غير صالح أو غير موجود",
        errorCode: "NO_STUDENT_FOUND",
      };
    }

    // ==========================================
    // المرحلة الثانية: استعلام سجلات التسميع (مستقل)
    // ==========================================
    let safeLogs: any[] = [];
    try {
      const { data: logs, error: logsError } = await supabase
        .from("memorization_logs")
        .select("*")
        .eq("student_id", studentRecord.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[getStudentProgressByToken] Logs query warning (non-fatal):", {
            message: logsError.message,
            code: logsError.code,
            details: logsError.details,
            hint: logsError.hint,
          });
        }
      } else if (Array.isArray(logs)) {
        safeLogs = logs;
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[getStudentProgressByToken] Logs exception (non-fatal):", err);
      }
    }

    // ==========================================
    // المرحلة الثالثة: استعلام سجلات الحضور (مستقل)
    // ==========================================
    let safeAttendance: any[] = [];
    try {
      const { data: attendance, error: attError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("student_id", studentRecord.id)
        .order("date", { ascending: false })
        .limit(30);

      if (attError) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[getStudentProgressByToken] Attendance records query warning, trying alternative (non-fatal):", {
            message: attError.message,
            code: attError.code,
            details: attError.details,
            hint: attError.hint,
          });
        }
        // Check if attendance table exists under alternate name
        const { data: altAttendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("student_id", studentRecord.id)
          .order("date", { ascending: false })
          .limit(30);

        if (Array.isArray(altAttendance)) {
          safeAttendance = altAttendance;
        }
      } else if (Array.isArray(attendance)) {
        safeAttendance = attendance;
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[getStudentProgressByToken] Attendance exception (non-fatal):", err);
      }
    }

    return {
      success: true,
      student: studentRecord,
      logs: safeLogs,
      attendance: safeAttendance,
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getStudentProgressByToken] Unexpected database exception:", err);
    }
    return {
      success: false,
      error: "تعذر تحميل بعض بيانات الطالب، يرجى المحاولة مرة أخرى.",
      errorCode: "DATABASE_QUERY_ERROR",
    };
  }
}
