"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { revalidateAllPaths } from "@/lib/actions/revalidate";

export type RealtimePayload<T extends { [key: string]: any } = Record<string, any>> = RealtimePostgresChangesPayload<T>;

interface RealtimeSyncOptions {
  tables?: Array<"students" | "memorization_logs" | "attendance_records">;
  onPayload?: (payload: RealtimePayload<any>) => void;
  enableToast?: boolean;
}

const DEFAULT_TABLES: Array<"students" | "memorization_logs" | "attendance_records"> = [
  "students",
  "memorization_logs",
  "attendance_records",
];

/**
 * Pure inbound Supabase Realtime synchronization hook.
 * Strictly listens to postgres_changes and refreshes client view.
 * Guarantees proper channel cleanup on unmount.
 */
export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const { tables = DEFAULT_TABLES, onPayload, enableToast = true } = options;

  const router = useRouter();
  const [notification, setNotification] = useState<string | null>(null);
  const onPayloadRef = useRef(onPayload);
  const tablesKey = tables.slice().sort().join(",");

  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    const supabase = createClient();
    const channels: RealtimeChannel[] = [];
    const activeTables = tablesKey.split(",") as Array<"students" | "memorization_logs" | "attendance_records">;

    activeTables.forEach((table) => {
      const channelName = `realtime_${table}_${Math.random().toString(36).substring(2, 9)}`;

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
          },
          async (payload: RealtimePayload) => {
            if (enableToast) {
              setNotification("🔔 تم تحديث البيانات فوريًا دون الحاجة لإعادة التحميل");
              setTimeout(() => setNotification(null), 3500);
            }

            // 1. Instant client-side state callback if provided
            if (onPayloadRef.current) {
              onPayloadRef.current(payload);
            }

            // 2. Bypass Next.js App Router server cache
            try {
              await revalidateAllPaths();
            } catch {
              // Ignore revalidation network errors when offline
            }

            // 3. Refresh Server Component tree
            router.refresh();
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach((ch) => {
        try {
          supabase.removeChannel(ch);
        } catch {
          // Cleanup ignore
        }
      });
    };
  }, [tablesKey, enableToast, router]);

  return { notification };
}
