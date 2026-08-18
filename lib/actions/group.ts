"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { GroupRow } from "@/types";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetches the current user's active/primary group_id.
 * 1. Queries `group_members` where user_id = auth.uid().
 * 2. Fallback: Queries `groups` where created_by = auth.uid().
 * 3. Fallback: Queries any accessible group via RLS or creates a default group.
 */
export async function getActiveGroupId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // 1. Primary lookup: group_members for current user
    const { data: memberRecord, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!memberError && memberRecord?.group_id) {
      return memberRecord.group_id;
    }

    // 2. Fallback lookup: groups created by current user
    const { data: createdGroup, error: createdError } = await supabase
      .from("groups")
      .select("id")
      .eq("created_by", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!createdError && createdGroup?.id) {
      // Ensure user is registered in group_members
      try {
        await supabase.from("group_members").insert({
          group_id: createdGroup.id,
          user_id: user.id,
          role: "admin",
        });
      } catch {
        // Non-blocking if already exists
      }
      return createdGroup.id;
    }

    // 3. Fallback lookup: any group accessible via RLS
    const { data: anyGroup, error: anyGroupError } = await supabase
      .from("groups")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!anyGroupError && anyGroup?.id) {
      return anyGroup.id;
    }

    // 4. Fallback creation: create a default group for the teacher
    try {
      const teacherName =
        (user.user_metadata?.full_name as string) || "التحفيظ";
      const groupName = `حلقة ${teacherName}`;

      const { data: newGroup, error: createError } = await supabase
        .from("groups")
        .insert({
          name: groupName,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (!createError && newGroup?.id) {
        await supabase.from("group_members").insert({
          group_id: newGroup.id,
          user_id: user.id,
          role: "admin",
        });
        return newGroup.id;
      }
    } catch {
      // Ignore creation error if schema restricts it
    }

    return null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getActiveGroupId] Error resolving active group:", err);
    }
    return null;
  }
}

export const getActiveGroupIdCached = cache(getActiveGroupId);

/**
 * Get all groups that the current user belongs to.
 */
export async function getUserGroups(): Promise<ActionResult<GroupRow[]>> {
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

    const { data: groups, error } = await supabase
      .from("groups")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return {
        success: false,
        error: "فشل جلب الحلقات: " + error.message,
      };
    }

    return {
      success: true,
      data: groups || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

/**
 * Creates a new group and automatically enrolls the creator as admin.
 */
export async function createGroup(name: string): Promise<ActionResult<GroupRow>> {
  if (!name || name.trim() === "") {
    return { success: false, error: "اسم الحلقة مطلوب" };
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
        error: "غير مصرح لك بإنشاء حلقة، يرجى تسجيل الدخول",
      };
    }

    const { data: newGroup, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError || !newGroup) {
      return {
        success: false,
        error: "فشل إنشاء الحلقة: " + (groupError?.message || "خطأ غير معروف"),
      };
    }

    // Add user as admin in group_members
    await supabase.from("group_members").insert({
      group_id: newGroup.id,
      user_id: user.id,
      role: "admin",
    });

    revalidatePath("/students");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: newGroup,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إنشاء الحلقة",
    };
  }
}
