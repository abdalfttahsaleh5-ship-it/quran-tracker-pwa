"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { attendanceSchema, AttendanceInput } from "@/lib/validations/log";
import { AttendanceRecordRow, AttendanceRecordInsert } from "@/types";
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

    const payload: AttendanceRecordInsert = {
      student_id: validation.data.student_id,
      teacher_id: user.id,
      date: validation.data.date,
      status: validation.data.status,
      notes: validation.data.notes || null,
    };

    // Upsert using student_id and date unique constraint
    const { data: record, error } = await supabase
      .from("attendance_records")
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
    revalidatePath("/students");
    return {
      success: true,
      data: record,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تسجيل الحضور",
    };
  }
}

export async function deleteAttendance(
  studentId: string,
  date: string
): Promise<ActionResult> {
  if (!studentId || !date) {
    return { success: false, error: "معرف الطالب والتاريخ مطلوبان" };
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
        error: "غير مصرح لك بتعديل الحضور، يرجى تسجيل الدخول",
      };
    }

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("student_id", studentId)
      .eq("date", date)
      .eq("teacher_id", user.id);

    if (error) {
      return {
        success: false,
        error: "فشل إلغاء تسجيل الحضور: " + error.message,
      };
    }

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إلغاء تسجيل الحضور",
    };
  }
}

export async function deleteAttendanceById(
  recordId: string,
  studentId?: string
): Promise<ActionResult> {
  if (!recordId) {
    return { success: false, error: "معرف سجل الحضور مطلوب" };
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
        error: "غير مصرح لك بتعديل الحضور، يرجى تسجيل الدخول",
      };
    }

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", recordId)
      .eq("teacher_id", user.id);

    if (error) {
      return {
        success: false,
        error: "فشل حذف سجل الحضور: " + error.message,
      };
    }

    if (studentId) {
      revalidatePath(`/students/${studentId}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/students");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حذف سجل الحضور",
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

    const payload: AttendanceRecordInsert[] = records.map((r) => ({
      student_id: r.student_id,
      teacher_id: user.id,
      date: r.date,
      status: r.status,
      notes: r.notes || null,
    }));

    const { error } = await supabase
      .from("attendance_records")
      .upsert(payload, { onConflict: "student_id,date" });

    if (error) {
      return {
        success: false,
        error: "فشل تحديث الحضور الجماعي: " + error.message,
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/students");
    revalidatePath("/");
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
      data: records || [],
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
      data: records || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export const getStudentAttendanceCached = cache(getStudentAttendance);
export const getDailyAttendanceOverviewCached = cache(getDailyAttendanceOverview);
