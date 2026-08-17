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

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const {
    tables = ["students", "memorization_logs", "attendance_records"],
    onPayload,
    enableToast = true,
  } = options;

  const router = useRouter();
  const [notification, setNotification] = useState<string | null>(null);
  const onPayloadRef = useRef(onPayload);

  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    const supabase = createClient();
    const channels: RealtimeChannel[] = [];

    tables.forEach((table) => {
      const channelName = `realtime_sync_${table}_${Math.random().toString(36).substring(2, 9)}`;

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
            await revalidateAllPaths();

            // 3. Refresh Server Component tree
            router.refresh();
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach((ch) => {
        supabase.removeChannel(ch);
      });
    };
  }, [tables, enableToast, router]);

  return { notification };
}
