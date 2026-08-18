"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { GroupRow } from "@/types";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export type GroupRole = "owner" | "assistant";

export interface GroupSummary {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  role: GroupRole;
}

export interface GetUserGroupsResult {
  success: boolean;
  data?: GroupSummary[];
  error?: string;
}

export type ActiveGroupIdResult =
  | (string & {
      status: "ok";
      groupId: string;
    })
  | (null & {
      status: "no_group";
    })
  | (null & {
      status: "multiple_groups";
      groups: GroupSummary[];
    });

export type ActiveGroupResult =
  | {
      status: "ok";
      group: GroupSummary;
    }
  | {
      status: "no_group";
    }
  | {
      status: "multiple_groups";
      groups: GroupSummary[];
    };

/**
 * 1. getUserGroups()
 * Fetches all groups for the authenticated user from group_members with roles.
 * Strongly typed: returns { id, name, created_by, created_at, role }.
 */
export async function getUserGroups(): Promise<GetUserGroupsResult> {
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

    // Query memberships from group_members
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id, role")
      .eq("user_id", user.id);

    if (memberError) {
      return {
        success: false,
        error: "فشل جلب بيانات عضوية الحلقات: " + memberError.message,
      };
    }

    if (!memberships || memberships.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Fetch corresponding groups
    const groupIds = memberships.map((m) => m.group_id);
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("id, name, created_by, created_at")
      .in("id", groupIds);

    if (groupsError) {
      return {
        success: false,
        error: "فشل جلب تفاصيل الحلقات: " + groupsError.message,
      };
    }

    const roleMap = new Map<string, GroupRole>(
      memberships.map((m) => [m.group_id, m.role as GroupRole])
    );

    const userGroups: GroupSummary[] = (groups || []).map((g) => ({
      id: g.id,
      name: g.name,
      created_by: g.created_by || "",
      created_at: g.created_at,
      role: roleMap.get(g.id) || "assistant",
    }));

    return {
      success: true,
      data: userGroups,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}

export const getUserGroupsCached = cache(getUserGroups);

/**
 * 2. getActiveGroupId()
 * Pure resolution helper returning:
 * - { status: "ok", groupId: string } if exactly 1 group exists.
 * - { status: "multiple_groups", groups: GroupSummary[] } if > 1 group.
 * - { status: "no_group" } if 0 groups.
 * (MUST NOT auto-create a group).
 */
export async function getActiveGroupId(): Promise<ActiveGroupIdResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { status: "no_group" } as unknown as ActiveGroupIdResult;
    }

    const groupsRes = await getUserGroups();
    if (!groupsRes.success || !groupsRes.data) {
      return { status: "no_group" } as unknown as ActiveGroupIdResult;
    }

    const userGroups = groupsRes.data;

    if (userGroups.length === 0) {
      return { status: "no_group" } as unknown as ActiveGroupIdResult;
    }

    if (userGroups.length === 1) {
      return {
        status: "ok",
        groupId: userGroups[0].id,
      } as unknown as ActiveGroupIdResult;
    }

    return {
      status: "multiple_groups",
      groups: userGroups,
    } as unknown as ActiveGroupIdResult;
  } catch {
    return { status: "no_group" } as unknown as ActiveGroupIdResult;
  }
}

export const getActiveGroupIdCached = cache(getActiveGroupId);

/**
 * 3. getActiveGroup()
 * Resolves active group details + role based on the same rules.
 * - { status: "ok", group: GroupSummary } if exactly 1 group exists.
 * - { status: "multiple_groups", groups: GroupSummary[] } if > 1 group.
 * - { status: "no_group" } if 0 groups.
 */
export async function getActiveGroup(): Promise<ActiveGroupResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { status: "no_group" };
    }

    const groupsRes = await getUserGroups();
    if (!groupsRes.success || !groupsRes.data) {
      return { status: "no_group" };
    }

    const userGroups = groupsRes.data;

    if (userGroups.length === 0) {
      return { status: "no_group" };
    }

    if (userGroups.length === 1) {
      return {
        status: "ok",
        group: userGroups[0],
      };
    }

    return {
      status: "multiple_groups",
      groups: userGroups,
    };
  } catch {
    return { status: "no_group" };
  }
}

export const getActiveGroupCached = cache(getActiveGroup);

/**
 * 4. createDefaultGroup()
 * Explicit onboarding function to create 'حلقة القرآن الكريم'.
 * Does NOT run automatically from getActiveGroupId().
 * Checks if user already belongs to a group before creating to avoid duplicates.
 */
export async function createDefaultGroup(): Promise<ActionResult<GroupRow>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "غير مصرح لك بإنشاء حلقة، يرجى تسجيل الدخول أولاً",
      };
    }

    // Check if user already belongs to any group to prevent duplicates
    const existingGroupsRes = await getUserGroups();
    if (existingGroupsRes.success && existingGroupsRes.data && existingGroupsRes.data.length > 0) {
      const firstGroup = existingGroupsRes.data[0];
      return {
        success: false,
        error: "المستخدم ينتمي بالفعل إلى حلقة موجودة مسبقاً",
        data: {
          id: firstGroup.id,
          name: firstGroup.name,
          created_by: firstGroup.created_by,
          created_at: firstGroup.created_at,
        },
      };
    }

    // Insert new group
    const { data: newGroup, error: insertError } = await supabase
      .from("groups")
      .insert({
        name: "حلقة القرآن الكريم",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !newGroup) {
      return {
        success: false,
        error: "فشل إنشاء الحلقة الافتراضية: " + (insertError?.message || "خطأ غير معروف"),
      };
    }

    return {
      success: true,
      data: newGroup,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إنشاء الحلقة الافتراضية",
    };
  }
}
