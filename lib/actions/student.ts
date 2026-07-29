"use server";

import { createClient } from "@/lib/supabase/server";
import { studentSchema, StudentInput } from "@/lib/validations/student";
import { StudentRow, StudentInsert, StudentUpdate } from "@/types";
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

    return {
      success: true,
      data: (students || []) as StudentRow[],
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
