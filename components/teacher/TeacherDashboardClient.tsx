"use client";

import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";

export function TeacherDashboardClient() {
  const { notification } = useRealtimeSync();

  if (!notification) return null;

  return (
    <div className="p-3 bg-teal-800 text-white font-bold text-xs rounded-xl shadow-lg animate-in slide-in-from-top duration-300 flex items-center justify-center gap-2 mb-4">
      <span>{notification}</span>
    </div>
  );
}
