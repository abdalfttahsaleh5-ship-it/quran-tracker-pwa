"use server";

import { revalidatePath } from "next/cache";

export async function revalidateAllPaths(): Promise<void> {
  revalidatePath("/", "layout");
}
