"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { getAttendanceAlertsMap } from "@/lib/attendanceAlerts";
import { Search, Printer, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StudentReportItem } from "./PrintReportView";
import { useRealtimeSync, RealtimePayload } from "@/lib/hooks/useRealtimeSync";

const PrintReportView = dynamic(() => import("./PrintReportView").then((mod) => mod.PrintReportView), { ssr: false });

interface SummaryReportTableProps {
  students: StudentRow[];
  logs: MemorizationLogRow[];
  attendance: AttendanceRecordRow[];
}

export type PeriodType = "daily" | "weekly" | "monthly";

export function SummaryReportTable({ students, logs, attendance }: SummaryReportTableProps) {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [localAttendance, setLocalAttendance] = useState<AttendanceRecordRow[]>(attendance);

  // Synchronize local state when attendance prop changes
  useEffect(() => {
    setLocalAttendance(attendance);
  }, [attendance]);

  // Realtime Payload Handler for immediate synchronization
  const handleRealtimePayload = useCallback((payload: RealtimePayload) => {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    if (table === "attendance_records") {
      if ((eventType === "INSERT" || eventType === "UPDATE") && newRecord) {
        const rec = newRecord as unknown as AttendanceRecordRow;
        setLocalAttendance((prev) => {
          const exists = prev.some(
            (a) => a.id === rec.id || (a.student_id === rec.student_id && a.date === rec.date)
          );
          if (exists) {
            return prev.map((a) =>
              a.id === rec.id || (a.student_id === rec.student_id && a.date === rec.date) ? rec : a
            );
          }
          return [rec, ...prev];
        });
      } else if (eventType === "DELETE" && oldRecord) {
        setLocalAttendance((prev) =>
          prev.filter((a) => (oldRecord.id ? a.id !== oldRecord.id : true))
        );
      }
    }
  }, []);

  useRealtimeSync({
    tables: ["attendance_records"],
    onPayload: handleRealtimePayload,
  });

  // Helper date calculators using local system timezone
  const dateBounds = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    // Start of current week (Sunday / الأحد 00:00:00)
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const startOfWeekDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    const wYear = startOfWeekDate.getFullYear();
    const wMonth = String(startOfWeekDate.getMonth() + 1).padStart(2, "0");
    const wDay = String(startOfWeekDate.getDate()).padStart(2, "0");
    const startOfWeekStr = `${wYear}-${wMonth}-${wDay}`;

    // Start of current calendar month (1st of month 00:00:00)
    const startOfMonthStr = `${year}-${month}-01`;

    return { todayStr, startOfWeekStr, startOfMonthStr };
  }, []);

  // Map student IDs to active absence alerts
  const alertsMap = useMemo(() => {
    return getAttendanceAlertsMap(students, localAttendance);
  }, [students, localAttendance]);

  // Total unique session dates recorded across the halaqah for the selected period
  const totalWeeklySessionDays = useMemo(() => {
    const dates = new Set<string>();
    localAttendance.forEach((a) => {
      if (a.date && a.date >= dateBounds.startOfWeekStr && a.date <= dateBounds.todayStr) {
        dates.add(a.date);
      }
    });
    return dates.size;
  }, [localAttendance, dateBounds]);

  const totalMonthlySessionDays = useMemo(() => {
    const dates = new Set<string>();
    localAttendance.forEach((a) => {
      if (a.date && a.date >= dateBounds.startOfMonthStr && a.date <= dateBounds.todayStr) {
        dates.add(a.date);
      }
    });
    return dates.size;
  }, [localAttendance, dateBounds]);

  // Helper to extract local YYYY-MM-DD from log created_at
  const getLogLocalDate = useCallback((dateStr?: string | null): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Aggregate items per student based on selected period
  const reportItems: StudentReportItem[] = useMemo(() => {
    return students.map((student) => {
      let filteredLogs: MemorizationLogRow[] = [];
      let filteredAttendance: AttendanceRecordRow[] = [];

      if (period === "daily") {
        filteredLogs = logs.filter((l) => {
          if (!l.created_at || l.student_id !== student.id) return false;
          return getLogLocalDate(l.created_at) === dateBounds.todayStr;
        });
        filteredAttendance = localAttendance.filter(
          (a) => a.student_id === student.id && a.date === dateBounds.todayStr
        );
      } else if (period === "weekly") {
        filteredLogs = logs.filter((l) => {
          if (!l.created_at || l.student_id !== student.id) return false;
          const d = getLogLocalDate(l.created_at);
          return d >= dateBounds.startOfWeekStr && d <= dateBounds.todayStr;
        });
        filteredAttendance = localAttendance.filter(
          (a) => a.student_id === student.id && a.date >= dateBounds.startOfWeekStr && a.date <= dateBounds.todayStr
        );
      } else if (period === "monthly") {
        filteredLogs = logs.filter((l) => {
          if (!l.created_at || l.student_id !== student.id) return false;
          const d = getLogLocalDate(l.created_at);
          return d >= dateBounds.startOfMonthStr && d <= dateBounds.todayStr;
        });
        filteredAttendance = localAttendance.filter(
          (a) => a.student_id === student.id && a.date >= dateBounds.startOfMonthStr && a.date <= dateBounds.todayStr
        );
      }

      // Deduplicate attendance records by date to prevent double-counting
      const uniqueAttendanceMap = new Map<string, AttendanceRecordRow>();
      filteredAttendance.forEach((rec) => {
        uniqueAttendanceMap.set(rec.date, rec);
      });
      const uniqueAttendanceList = Array.from(uniqueAttendanceMap.values());

      const attendedDays = uniqueAttendanceList.filter(
        (a) =>
          a.status === "حاضر" ||
          a.status === "متأخر" ||
          (a.status as string) === "present" ||
          (a.status as string) === "late"
      ).length;

      let attendanceText = "لم يرصد";
      let badgeStyle = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";

      if (period === "daily") {
        if (uniqueAttendanceList.length > 0) {
          const status = uniqueAttendanceList[0].status;
          if (status === "حاضر" || (status as string) === "present") {
            attendanceText = "حاضر";
            badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800";
          } else if (status === "غائب" || (status as string) === "absent") {
            attendanceText = "غائب";
            badgeStyle = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800";
          } else if (status === "مستأذن" || (status as string) === "excused") {
            attendanceText = "مستأذن";
            badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
          } else if (status === "متأخر" || (status as string) === "late") {
            attendanceText = "متأخر";
            badgeStyle = "bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300 dark:border-teal-800";
          } else {
            attendanceText = String(status);
            badgeStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
          }
        } else {
          attendanceText = "لم يرصد";
          badgeStyle = "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
        }
      } else if (period === "weekly") {
        const totalSessions = Math.max(totalWeeklySessionDays, uniqueAttendanceList.length);
        if (totalSessions > 0) {
          attendanceText = `${attendedDays} / ${totalSessions}`;
          if (attendedDays === totalSessions) {
            badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800";
          } else if (attendedDays > 0) {
            badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
          } else {
            badgeStyle = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800";
          }
        } else {
          attendanceText = "0 / 0";
          badgeStyle = "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
        }
      } else if (period === "monthly") {
        const totalSessions = Math.max(totalMonthlySessionDays, uniqueAttendanceList.length);
        if (totalSessions > 0) {
          const percentage = Math.round((attendedDays / totalSessions) * 100);
          attendanceText = `${attendedDays} / ${totalSessions} (${percentage}%)`;
          if (percentage >= 85) {
            badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800";
          } else if (percentage >= 60) {
            badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
          } else {
            badgeStyle = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800";
          }
        } else {
          attendanceText = "0 / 0 (0%)";
          badgeStyle = "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
        }
      }

      const pagesCount = filteredLogs.reduce((sum, l) => sum + (l.page_count || 1), 0);
      const roundedPages = Number(pagesCount.toFixed(2));

      return {
        student,
        attendanceText,
        badgeStyle,
        pagesCount: roundedPages,
        totalPresentCount: attendedDays,
      };
    });
  }, [students, logs, localAttendance, period, dateBounds, totalWeeklySessionDays, totalMonthlySessionDays, getLogLocalDate]);

  // Filter report items by search query
  const filteredReportItems = useMemo(() => {
    if (!searchQuery.trim()) return reportItems;
    const q = searchQuery.trim().toLowerCase();
    return reportItems.filter((item) => item.student.full_name.toLowerCase().includes(q));
  }, [reportItems, searchQuery]);

  const periodLabelMap: Record<PeriodType, string> = {
    daily: "التقرير اليومي (اليوم)",
    weekly: "التقرير الأسبوعي (هذا الأسبوع)",
    monthly: "التقرير الشهري (هذا الشهر)",
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      {/* Print-only View Component */}
      <PrintReportView reportItems={filteredReportItems} periodLabel={periodLabelMap[period]} />

      {/* Screen Interactive Dashboard Card */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm print:hidden">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>تقرير متابعة طلاب الحلقة 📊</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              إحصائيات الحضور والصفحات حسب الفترة الزمانية
            </CardDescription>
          </div>

          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-bold rounded-xl shrink-0"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">تصدير تقرير الإدارة (PDF / طباعة) 🖨️</span>
            <span className="sm:hidden">طباعة 🖨️</span>
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Period Selection Segmented Controls & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Segmented Control Pill */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPeriod("daily")}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  period === "daily"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                اليومي
              </button>

              <button
                type="button"
                onClick={() => setPeriod("weekly")}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  period === "weekly"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                الأسبوعي
              </button>

              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  period === "monthly"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                الشهري
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="ابحث باسم الطالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold"
              />
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف الدراسي</th>
                  <th className="p-3 text-center">حالة الحضور</th>
                  <th className="p-3 text-center">إجمالي الصفحات</th>
                  <th className="p-3 text-center">ولي الأمر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredReportItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      لا يوجد طلاب مطابقين للبحث
                    </td>
                  </tr>
                ) : (
                  filteredReportItems.map((item, index) => (
                    <tr
                      key={item.student.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/students/${item.student.id}`}
                            prefetch={true}
                            className="hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline transition-colors"
                          >
                            {item.student.full_name}
                          </Link>
                          {alertsMap.has(item.student.id) && (
                            <span
                              title={`تنبيه متابعة عاجلة: ${alertsMap.get(item.student.id)?.reason}`}
                              className="text-xs cursor-help shrink-0"
                            >
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {item.student.academic_grade || "غير محدد"}
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                            item.attendanceText.includes("/") ? "dir-ltr" : "dir-rtl"
                          } ${
                            item.badgeStyle || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {item.attendanceText}
                        </span>
                      </td>
                      <td className="p-3 text-center font-black text-emerald-700 dark:text-emerald-400">
                        {item.pagesCount > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            📖 {item.pagesCount} صفحة
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {item.student.parent_phone ? (
                          <span className="font-mono text-slate-600 dark:text-slate-400 dir-ltr inline-block">
                            {item.student.parent_phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

