"use server";

import { createClient } from "@/lib/supabase/server";
import { attendanceSchema, AttendanceInput } from "@/lib/validations/log";
import { AttendanceRecordRow } from "@/types";
import { Database } from "@/types/database";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function recordAttendance(data: AttendanceInput): Promise<ActionResult<AttendanceRecordRow>> {
  const validation = attendanceSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "بيانات الحضور غير صحيحة",
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
        error: "غير مصرح لك بتسجيل الحضور، يرجى تسجيل الدخول",
      };
    }

    const payload: Database["public"]["Tables"]["attendance_records"]["Insert"] = {
      student_id: validation.data.student_id,
      teacher_id: user.id,
      date: validation.data.date,
      status: validation.data.status,
      notes: validation.data.notes || null,
    };

    // Upsert using student_id and date unique constraint
    const { data: record, error } = await (supabase.from("attendance_records") as ReturnType<typeof supabase.from>)
      .upsert(payload, { onConflict: "student_id,date" })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "فشل تسجيل الحضور: " + error.message,
      };
    }

    revalidatePath(`/students/${validation.data.student_id}`);
    revalidatePath("/dashboard");
    return {
      success: true,
      data: record as AttendanceRecordRow,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تسجيل الحضور",
    };
  }
}

export async function recordBulkAttendance(records: AttendanceInput[]): Promise<ActionResult> {
  if (!records || records.length === 0) {
    return { success: false, error: "لا توجد سجلات لتحديثها" };
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
        error: "غير مصرح لك بتسجيل الحضور الجماعي",
      };
    }

    const payload = records.map((r) => ({
      student_id: r.student_id,
      teacher_id: user.id,
      date: r.date,
      status: r.status,
      notes: r.notes || null,
    }));

    const { error } = await (supabase.from("attendance_records") as ReturnType<typeof supabase.from>)
      .upsert(payload, { onConflict: "student_id,date" });

    if (error) {
      return {
        success: false,
        error: "فشل تحديث الحضور الجماعي: " + error.message,
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function getStudentAttendance(
  studentId: string,
  limit: number = 30
): Promise<ActionResult<AttendanceRecordRow[]>> {
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

    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", studentId)
      .eq("teacher_id", user.id)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: "فشل جلب سجلات الحضور: " + error.message,
      };
    }

    return {
      success: true,
      data: (records || []) as AttendanceRecordRow[],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function getDailyAttendanceOverview(
  date?: string
): Promise<ActionResult<AttendanceRecordRow[]>> {
  const targetDate = date || new Date().toISOString().split("T")[0];

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "غير مصرح لك للوصول إلى بيانات الحضور اليومي",
      };
    }

    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("teacher_id", user.id)
      .eq("date", targetDate);

    if (error) {
      return {
        success: false,
        error: "فشل جلب الحضور اليومي: " + error.message,
      };
    }

    return {
      success: true,
      data: (records || []) as AttendanceRecordRow[],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}
