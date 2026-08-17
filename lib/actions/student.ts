"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { studentSchema, StudentInput } from "@/lib/validations/student";
import { StudentRow, StudentInsert, StudentUpdate, ParentProgressPayload, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { revalidatePath } from "next/cache";

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

    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .eq("teacher_id", user.id)
      .order("full_name", { ascending: true });

    if (error) {
      return {
        success: false,
        error: "فشل جلب قائمة الطلاب: " + error.message,
      };
    }

    // Query memorization logs to calculate total pages per student
    const { data: logs } = await supabase
      .from("memorization_logs")
      .select("student_id, page_count")
      .eq("teacher_id", user.id);

    const pagesMap: Record<string, number> = {};
    (logs || []).forEach((log) => {
      if (log.student_id) {
        pagesMap[log.student_id] = Number(((pagesMap[log.student_id] || 0) + (log.page_count || 1)).toFixed(2));
      }
    });

    // Auto-patch any student missing parent_token and attach total_pages_count
    const safeStudents: StudentRow[] = await Promise.all(
      (students || []).map(async (student) => {
        const totalPages = pagesMap[student.id] || 0;
        let token = student.parent_token;
        if (!token) {
          token = crypto.randomUUID();
          await supabase
            .from("students")
            .update({ parent_token: token })
            .eq("id", student.id);
        }
        return { ...student, parent_token: token, total_pages_count: totalPages };
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

    const insertPayload: StudentInsert = {
      teacher_id: user.id,
      full_name: validation.data.full_name,
      parent_phone: validation.data.parent_phone || null,
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
      parent_phone: validation.data.parent_phone || null,
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
      .eq("teacher_id", user.id)
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
      .eq("id", id)
      .eq("teacher_id", user.id);

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

export async function getStudentProgressByToken(token: string): Promise<ParentProgressPayload> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return { success: false, error: "الرابط غير صحيح أو مفقود" };
  }

  const cleanToken = token.trim();

  try {
    const supabase = createClient();

    // Direct RLS-safe query on students table by parent_token
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("parent_token", cleanToken)
      .maybeSingle();

    if (studentError || !student) {
      return { success: false, error: "الرابط غير صالح أو تم حذف بيانات الطالب" };
    }

    const { data: logs } = await supabase
      .from("memorization_logs")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", student.id)
      .order("date", { ascending: false });

    return {
      success: true,
      student,
      logs: logs || [],
      attendance: attendance || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء تحميل بيانات الطالب",
    };
  }
}

export interface ParentSearchResult {
  success: boolean;
  token?: string;
  students?: Array<{ id: string; full_name: string; parent_token: string }>;
  error?: string;
}

export async function findStudentByPhoneOrCode(input: string): Promise<ParentSearchResult> {
  if (!input || typeof input !== "string" || input.trim() === "") {
    return { success: false, error: "يرجى إدخال رقم الهاتف المسجل" };
  }

  const cleanInput = input.trim().replace(/[\s\-\(\)]/g, "");

  try {
    const supabase = createClient();

    // Query students by parent_phone
    const { data: students, error } = await supabase
      .from("students")
      .select("id, full_name, parent_token, parent_phone")
      .or(`parent_phone.eq.${cleanInput},parent_phone.eq.${input.trim()}`);

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
      students,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء البحث",
    };
  }
}

export const getStudentsCached = cache(getStudents);
export const getStudentProgressByTokenCached = cache(getStudentProgressByToken);

export interface TeacherReportDataResult {
  success: boolean;
  students?: StudentRow[];
  logs?: MemorizationLogRow[];
  attendance?: AttendanceRecordRow[];
  error?: string;
}

export async function getTeacherReportData(): Promise<TeacherReportDataResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "غير مصرح لك للوصول، يرجى تسجيل الدخول أولاً" };
    }

    const [studentsRes, logsRes, attendanceRes] = await Promise.all([
      supabase.from("students").select("*").eq("teacher_id", user.id).order("full_name", { ascending: true }),
      supabase.from("memorization_logs").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false }),
      supabase.from("attendance_records").select("*").eq("teacher_id", user.id).order("date", { ascending: false }),
    ]);

    return {
      success: true,
      students: studentsRes.data || [],
      logs: logsRes.data || [],
      attendance: attendanceRes.data || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء جلب بيانات التقرير",
    };
  }
}

export const getTeacherReportDataCached = cache(getTeacherReportData);
