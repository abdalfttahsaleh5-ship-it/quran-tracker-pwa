"use server";

import { createClient } from "@/lib/supabase/server";
import { studentSchema, StudentInput } from "@/lib/validations/student";
import { StudentRow, StudentInsert, StudentUpdate, ParentProgressPayload, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { Database } from "@/types/database";
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

    // Auto-patch any student missing parent_token
    const studentList = (students || []) as unknown as StudentRow[];
    const safeStudents = await Promise.all(
      studentList.map(async (student) => {
        if (!student.parent_token) {
          const newToken = crypto.randomUUID();
          await (supabase.from("students") as ReturnType<typeof supabase.from>)
            .update({ parent_token: newToken } as unknown as Database["public"]["Tables"]["students"]["Update"])
            .eq("id", student.id);
          return { ...student, parent_token: newToken };
        }
        return student;
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
      parent_token: crypto.randomUUID(),
    };

    const { data: newStudent, error } = await (supabase.from("students") as ReturnType<typeof supabase.from>)
      .insert(insertPayload as unknown as Database["public"]["Tables"]["students"]["Insert"])
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
      data: newStudent as StudentRow,
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
    };

    const { data: updatedStudent, error } = await (supabase.from("students") as ReturnType<typeof supabase.from>)
      .update(updatePayload as unknown as Database["public"]["Tables"]["students"]["Update"])
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
      data: updatedStudent as StudentRow,
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
  if (!token) {
    return { success: false, error: "الرابط غير صحيح أو مفقود" };
  }

  const supabase = createClient();

  try {
    // 1. Try RPC function first
    const rpcFn = supabase.rpc as unknown as (
      fnName: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;

    const { data: rpcData, error: rpcError } = await rpcFn("get_student_progress_by_token", {
      p_token: token,
    });

    if (!rpcError && rpcData) {
      const payload = rpcData as unknown as ParentProgressPayload;
      if (payload.success && payload.student) {
        return payload;
      }
    }

    // 2. Direct fallback query if RPC is unconfigured or blocked by Postgres type validation
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("parent_token", token)
      .maybeSingle();

    if (studentError || !student) {
      return { success: false, error: "الرابط غير صالح أو تم حذف بيانات الطالب" };
    }

    const studentRow = student as unknown as StudentRow;

    const { data: logs } = await supabase
      .from("memorization_logs")
      .select("*")
      .eq("student_id", studentRow.id)
      .order("created_at", { ascending: false });

    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", studentRow.id)
      .order("date", { ascending: false });

    return {
      success: true,
      student: studentRow,
      logs: (logs || []) as unknown as MemorizationLogRow[],
      attendance: (attendance || []) as unknown as AttendanceRecordRow[],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء تحميل بيانات الطالب",
    };
  }
}
