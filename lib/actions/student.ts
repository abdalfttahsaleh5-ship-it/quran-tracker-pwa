"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { studentSchema, StudentInput } from "@/lib/validations/student";
import { validateAndFormatJordanianPhone } from "@/lib/phoneUtils";
import { StudentRow, StudentInsert, StudentUpdate, ParentProgressPayload, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { revalidatePath } from "next/cache";
import { getActiveGroupId } from "./group";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getStudents(): Promise<ActionResult<StudentRow[]>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "غير مصرح لك للوصول، يرجى تسجيل الدخول أولاً",
      };
    }

    // Query from students_with_summary view directly (RLS filters by user's groups automatically)
    const { data: students, error } = await supabase
      .from("students_with_summary")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      return {
        success: false,
        error: "فشل جلب قائمة الطلاب: " + error.message,
      };
    }

    // Auto-patch any student missing parent_token and map pre-aggregated totals
    const safeStudents: StudentRow[] = await Promise.all(
      (students || []).map(async (student) => {
        let token = student.parent_token;
        if (!token) {
          token = crypto.randomUUID();
          await supabase
            .from("students")
            .update({ parent_token: token })
            .eq("id", student.id);
        }
        const totalPages = Number(student.total_pages_memorized || 0);
        const recitationsCount = Number(student.total_recitations_count || 0);
        return {
          ...student,
          parent_token: token,
          total_pages_memorized: totalPages,
          total_recitations_count: recitationsCount,
          total_pages_count: totalPages,
        };
      })
    );

    return {
      success: true,
      data: safeStudents,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function createStudent(data: StudentInput): Promise<ActionResult<StudentRow>> {
  const validation = studentSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "بيانات الطالب غير صحيحة",
    };
  }

  // Normalize and validate parent phone to standard Jordanian format (07XXXXXXXX)
  let normalizedPhone: string | null = null;
  if (validation.data.parent_phone && validation.data.parent_phone.trim() !== "") {
    const phoneRes = validateAndFormatJordanianPhone(validation.data.parent_phone);
    if (!phoneRes.isValid) {
      return {
        success: false,
        error: phoneRes.error || "رقم هاتف ولي الأمر غير صحيح",
      };
    }
    normalizedPhone = phoneRes.local || null;
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
        error: "غير مصرح لك بإضافة طالب، يرجى تسجيل الدخول",
      };
    }

    const activeGroupId = await getActiveGroupId();

    const insertPayload: StudentInsert = {
      teacher_id: user.id,
      group_id: activeGroupId || null,
      full_name: validation.data.full_name,
      parent_phone: normalizedPhone,
      academic_grade: validation.data.academic_grade || null,
      school_name: validation.data.school_name || null,
      address: validation.data.address || null,
      father_job: validation.data.father_job || null,
      avatar_url: validation.data.avatar_url || null,
      parent_token: crypto.randomUUID(),
    };

    const { data: newStudent, error } = await supabase
      .from("students")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "فشل إضافة الطالب: " + error.message,
      };
    }

    revalidatePath("/students");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: newStudent,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إضافة الطالب",
    };
  }
}

export async function updateStudent(id: string, data: StudentInput): Promise<ActionResult<StudentRow>> {
  if (!id) {
    return { success: false, error: "معرف الطالب مطلوب" };
  }

  const validation = studentSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "بيانات التعديل غير صحيحة",
    };
  }

  // Normalize and validate parent phone to standard Jordanian format (07XXXXXXXX)
  let normalizedPhone: string | null = null;
  if (validation.data.parent_phone && validation.data.parent_phone.trim() !== "") {
    const phoneRes = validateAndFormatJordanianPhone(validation.data.parent_phone);
    if (!phoneRes.isValid) {
      return {
        success: false,
        error: phoneRes.error || "رقم هاتف ولي الأمر غير صحيح",
      };
    }
    normalizedPhone = phoneRes.local || null;
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
        error: "غير مصرح لك لتعديل بيانات الطالب",
      };
    }

    const updatePayload: StudentUpdate = {
      full_name: validation.data.full_name,
      parent_phone: normalizedPhone,
      academic_grade: validation.data.academic_grade || null,
      school_name: validation.data.school_name || null,
      address: validation.data.address || null,
      father_job: validation.data.father_job || null,
      avatar_url: validation.data.avatar_url || null,
    };

    const { data: updatedStudent, error } = await supabase
      .from("students")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "فشل تحديث بيانات الطالب: " + error.message,
      };
    }

    revalidatePath("/students");
    revalidatePath("/dashboard");
    revalidatePath(`/students/${id}`);
    if (updatedStudent.parent_token) {
      revalidatePath(`/parent/${updatedStudent.parent_token}`);
    }
    return {
      success: true,
      data: updatedStudent,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تحديث بيانات الطالب",
    };
  }
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  if (!id) {
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
        error: "غير مصرح لك بحذف الطالب",
      };
    }

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "فشل حذف الطالب: " + error.message,
      };
    }

    revalidatePath("/students");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حذف الطالب",
    };
  }
}

export async function regenerateParentToken(studentId: string): Promise<ActionResult<{ parent_token: string }>> {
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
        error: "غير مصرح لك بتجديد الرابط، يرجى تسجيل الدخول",
      };
    }

    const newToken = crypto.randomUUID();

    const { data: updatedStudent, error } = await supabase
      .from("students")
      .update({ parent_token: newToken })
      .eq("id", studentId)
      .select("id, parent_token")
      .single();

    if (error || !updatedStudent) {
      return {
        success: false,
        error: "فشل تجديد رابط المتابعة: " + (error?.message || "الطالب غير موجود"),
      };
    }

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { parent_token: updatedStudent.parent_token },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تجديد الرابط",
    };
  }
}


import {
  getStudentProgressByToken as getParentProgressByToken,
  findStudentByPhoneOrCode as findParentStudentByPhoneOrCode,
  type ParentSearchResult,
} from "./parent";
export type { ParentSearchResult };

export async function getStudentProgressByToken(token: string): Promise<ParentProgressPayload> {
  return getParentProgressByToken(token);
}

export async function findStudentByPhoneOrCode(input: string): Promise<ParentSearchResult> {
  return findParentStudentByPhoneOrCode(input);
}

export const getStudentsCached = cache(getStudents);

export type TimeframeFilter = "today" | "this_week" | "this_month" | "last_30_days" | "all";

export interface TeacherReportDataOptions {
  timeframe?: TimeframeFilter;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface TeacherReportStats {
  totalStudents: number;
  activeStudents: number;
  totalMemorizedPages: number;
  overallAttendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}

export interface TeacherReportDataResult {
  success: boolean;
  students?: StudentRow[];
  logs?: MemorizationLogRow[];
  attendance?: AttendanceRecordRow[];
  stats?: TeacherReportStats;
  error?: string;
}

function resolveDateRange(options?: TeacherReportDataOptions): { startStr: string; endStr: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  if (options?.startDate && options?.endDate) {
    return { startStr: options.startDate, endStr: options.endDate };
  }

  const timeframe = options?.timeframe || "this_month";

  if (timeframe === "today") {
    return { startStr: todayStr, endStr: todayStr };
  }

  if (timeframe === "this_week") {
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const wYear = startOfWeek.getFullYear();
    const wMonth = String(startOfWeek.getMonth() + 1).padStart(2, "0");
    const wDay = String(startOfWeek.getDate()).padStart(2, "0");
    return { startStr: `${wYear}-${wMonth}-${wDay}`, endStr: todayStr };
  }

  if (timeframe === "last_30_days") {
    const start30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sYear = start30.getFullYear();
    const sMonth = String(start30.getMonth() + 1).padStart(2, "0");
    const sDay = String(start30.getDate()).padStart(2, "0");
    return { startStr: `${sYear}-${sMonth}-${sDay}`, endStr: todayStr };
  }

  if (timeframe === "all") {
    return { startStr: "", endStr: todayStr };
  }

  // Default: "this_month"
  // For early days in the month (first 7 days), extend window back 30 days so streak/absence alerts retain full historical context
  const dayOfMonth = now.getDate();
  if (dayOfMonth < 7) {
    const start30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sYear = start30.getFullYear();
    const sMonth = String(start30.getMonth() + 1).padStart(2, "0");
    const sDay = String(start30.getDate()).padStart(2, "0");
    return { startStr: `${sYear}-${sMonth}-${sDay}`, endStr: todayStr };
  }

  const startOfMonthStr = `${year}-${month}-01`;
  return { startStr: startOfMonthStr, endStr: todayStr };
}

export async function getTeacherReportData(options?: TeacherReportDataOptions): Promise<TeacherReportDataResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "غير مصرح لك للوصول، يرجى تسجيل الدخول أولاً" };
    }

    const { startStr, endStr } = resolveDateRange(options);
    const logLimit = options?.limit ?? 50;

    // 1. Fetch Students with pre-aggregated summary
    const studentsPromise = supabase
      .from("students_with_summary")
      .select("*")
      .order("full_name", { ascending: true });

    // 2. Fetch Time-scoped Attendance Records
    let attendanceQuery = supabase
      .from("attendance_records")
      .select("*");

    if (startStr) {
      attendanceQuery = attendanceQuery.gte("date", startStr);
    }
    if (endStr) {
      attendanceQuery = attendanceQuery.lte("date", endStr);
    }
    const attendancePromise = attendanceQuery.order("date", { ascending: false });

    // 3. Fetch Time-scoped and Paginated Recent Logs
    let logsQuery = supabase
      .from("memorization_logs")
      .select("*");

    if (startStr) {
      logsQuery = logsQuery.gte("date", startStr);
    }
    if (endStr) {
      logsQuery = logsQuery.lte("date", endStr);
    }
    const logsPromise = logsQuery.order("created_at", { ascending: false }).limit(logLimit);

    // 4. Lightweight Aggregated Logs Query for accurate totals without hydrating full row objects
    let statsLogsQuery = supabase
      .from("memorization_logs")
      .select("student_id, page_count");

    if (startStr) {
      statsLogsQuery = statsLogsQuery.gte("date", startStr);
    }
    if (endStr) {
      statsLogsQuery = statsLogsQuery.lte("date", endStr);
    }

    const [studentsRes, attendanceRes, logsRes, statsLogsRes] = await Promise.all([
      studentsPromise,
      attendancePromise,
      logsPromise,
      statsLogsQuery,
    ]);

    const rawStudents = studentsRes.data || [];
    const students: StudentRow[] = rawStudents.map((s) => {
      const totalPages = Number(s.total_pages_memorized || 0);
      const recitationsCount = Number(s.total_recitations_count || 0);
      return {
        ...s,
        total_pages_memorized: totalPages,
        total_recitations_count: recitationsCount,
        total_pages_count: totalPages,
      };
    });
    const attendance = attendanceRes.data || [];
    const logs = logsRes.data || [];
    const statsLogs = statsLogsRes.data || [];

    // Calculate Summary Statistics
    let totalMemorizedPages = 0;
    const activeStudentIds = new Set<string>();

    statsLogs.forEach((l) => {
      if (l.student_id) {
        activeStudentIds.add(l.student_id);
      }
      totalMemorizedPages += Number(l.page_count) || 1;
    });
    totalMemorizedPages = Number(totalMemorizedPages.toFixed(2));

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;

    attendance.forEach((a) => {
      if (a.status === "حاضر") totalPresent++;
      else if (a.status === "غائب") totalAbsent++;
      else if (a.status === "متأخر") totalLate++;
      else if (a.status === "مستأذن") totalExcused++;
    });

    const totalRecorded = totalPresent + totalAbsent + totalLate + totalExcused;
    const overallAttendanceRate = totalRecorded > 0
      ? Math.round(((totalPresent + totalLate) / totalRecorded) * 100)
      : 100;

    const stats: TeacherReportStats = {
      totalStudents: students.length,
      activeStudents: activeStudentIds.size,
      totalMemorizedPages,
      overallAttendanceRate,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
    };

    return {
      success: true,
      students,
      logs,
      attendance,
      stats,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء جلب بيانات التقرير",
    };
  }
}

export const getTeacherReportDataCached = cache(getTeacherReportData);
