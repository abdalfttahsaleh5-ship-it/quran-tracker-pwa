"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeSyncOptions {
  teacherId?: string;
  tables?: Array<"students" | "memorization_logs" | "attendance_records">;
  onUpdate?: () => void;
  enableToast?: boolean;
}

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const {
    teacherId,
    tables = ["students", "memorization_logs", "attendance_records"],
    onUpdate,
    enableToast = true,
  } = options;

  const router = useRouter();
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channels: RealtimeChannel[] = [];

    tables.forEach((table) => {
      const channelName = `realtime_${table}_${teacherId || "global"}`;
      const filter = teacherId ? `teacher_id=eq.${teacherId}` : undefined;

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
            filter: filter,
          },
          () => {
            if (enableToast) {
              setNotification("🔔 تم تحديث البيانات تلقائياً بفضل الاتصال المباشر");
              setTimeout(() => setNotification(null), 3500);
            }

            if (onUpdate) {
              onUpdate();
            } else {
              router.refresh();
            }
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
  }, [teacherId, tables, onUpdate, enableToast, router]);

  return { notification };
}
