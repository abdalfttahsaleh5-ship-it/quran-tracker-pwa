"use client";

import React, { useState, useMemo } from "react";
import { Users, Trophy, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { TeacherReportStats } from "@/lib/actions/student";
import { getAttendanceAlerts } from "@/lib/attendanceAlerts";
import { TopStudentsModal } from "./TopStudentsModal";

interface StatsCardsProps {
  students: StudentRow[];
  logs: MemorizationLogRow[];
  attendance?: AttendanceRecordRow[];
  stats?: TeacherReportStats;
}

export function StatsCards({ students, logs, attendance = [], stats }: StatsCardsProps) {
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);

  const totalStudents = stats?.totalStudents ?? students.length;

  // Real count of students requiring urgent follow-up (same logic as AttendanceAlertsCard)
  const followUpCount = useMemo(() => {
    return getAttendanceAlerts(students, attendance).length;
  }, [students, attendance]);

  return (
    <>
      <TopStudentsModal
        isOpen={isTopModalOpen}
        onClose={() => setIsTopModalOpen(false)}
        students={students}
        logs={logs}
      />

      <div className="stats-grid no-print print:hidden grid grid-cols-3 gap-2 sm:gap-4">
        {/* Metric 1: Registered Students */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الطلاب
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {totalStudents}
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              مسجل بالحلقة
            </CardDescription>
          </CardContent>
        </Card>

        {/* Metric 2: Interactive Top 5 Students Honor Roll Card */}
        <Card
          onClick={() => setIsTopModalOpen(true)}
          className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:to-slate-900/90 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-md hover:shadow-lg group"
        >
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <span>الطلاب الأوائل 🏆</span>
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 group-hover:scale-110 transition-transform">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-sm sm:text-lg font-black text-amber-950 dark:text-amber-200 tracking-tight">
              لوحة الشرف ✨
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-amber-700/80 dark:text-amber-400/80 font-bold truncate">
              أفضل 5 طلاب (انقر للعرض)
            </CardDescription>
          </CardContent>
        </Card>

        {/* Metric 3: Students Needing Follow-up */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              طلاب بحاجة إلى متابعة
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight flex items-baseline gap-1">
              <span>{followUpCount}</span>
              <span className="text-xs text-slate-400 font-bold">/{totalStudents}</span>
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              متابعة عاجلة
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
