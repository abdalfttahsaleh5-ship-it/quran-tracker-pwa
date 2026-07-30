"use client";

import React, { useState, useMemo } from "react";
import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { Search, Printer, Calendar, BookOpen, Users, Phone, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PrintReportView, StudentReportItem } from "./PrintReportView";

interface SummaryReportTableProps {
  students: StudentRow[];
  logs: MemorizationLogRow[];
  attendance: AttendanceRecordRow[];
}

export type PeriodType = "daily" | "weekly" | "monthly";

export function SummaryReportTable({ students, logs, attendance }: SummaryReportTableProps) {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper date calculators
  const dateBounds = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Start of week (Saturday)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const distToSat = (dayOfWeek + 1) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distToSat);
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

    // Start of month (1st)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

    return { todayStr, startOfWeekStr, startOfMonthStr };
  }, []);

  // Aggregate items per student based on selected period
  const reportItems: StudentReportItem[] = useMemo(() => {
    return students.map((student) => {
      let filteredLogs: MemorizationLogRow[] = [];
      let filteredAttendance: AttendanceRecordRow[] = [];
      let attendanceText = "غير مسجل";

      if (period === "daily") {
        filteredLogs = logs.filter(
          (l) => l.student_id === student.id && l.created_at && l.created_at.startsWith(dateBounds.todayStr)
        );
        filteredAttendance = attendance.filter(
          (a) => a.student_id === student.id && a.date === dateBounds.todayStr
        );

        if (filteredAttendance.length > 0) {
          const status = filteredAttendance[0].status;
          if (status === "حاضر") attendanceText = "حاضر 🟢";
          else if (status === "متأخر") attendanceText = "متأخر 🟡";
          else if (status === "مستأذن") attendanceText = "مستأذن 🔵";
          else if (status === "غائب") attendanceText = "غائب 🔴";
        }
      } else if (period === "weekly") {
        filteredLogs = logs.filter(
          (l) => l.student_id === student.id && l.created_at && l.created_at >= dateBounds.startOfWeekStr
        );
        filteredAttendance = attendance.filter(
          (a) => a.student_id === student.id && a.date >= dateBounds.startOfWeekStr
        );

        const presentDays = filteredAttendance.filter(
          (a) => a.status === "حاضر" || a.status === "متأخر"
        ).length;
        attendanceText = filteredAttendance.length > 0 ? `${presentDays} / ${filteredAttendance.length} أيام` : "لا يوجد سجل";
      } else if (period === "monthly") {
        filteredLogs = logs.filter(
          (l) => l.student_id === student.id && l.created_at && l.created_at >= dateBounds.startOfMonthStr
        );
        filteredAttendance = attendance.filter(
          (a) => a.student_id === student.id && a.date >= dateBounds.startOfMonthStr
        );

        const presentDays = filteredAttendance.filter(
          (a) => a.status === "حاضر" || a.status === "متأخر"
        ).length;
        attendanceText = filteredAttendance.length > 0 ? `${presentDays} يوماً` : "لا يوجد سجل";
      }

      const pagesCount = filteredLogs.reduce((sum, l) => sum + (l.page_count || 1), 0);
      const roundedPages = Number(pagesCount.toFixed(2));

      return {
        student,
        attendanceText,
        pagesCount: roundedPages,
      };
    });
  }, [students, logs, attendance, period, dateBounds]);

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
        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>تقرير متابعة طلاب الحلقة 📊</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              تجميع إحصائيات الحضور وعدد صفحات الحفظ والمراجعة حسب الفترة الزمانية
            </CardDescription>
          </div>

          <Button
            onClick={handlePrint}
            size="lg"
            className="gap-2 bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-2xl shadow-md shrink-0"
          >
            <Printer className="w-5 h-5 text-amber-300" />
            <span>تصدير تقرير الإدارة (PDF / طباعة) 🖨️</span>
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Period Selection Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Period Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPeriod("daily")}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  period === "daily"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                اليومي (اليوم)
              </button>

              <button
                type="button"
                onClick={() => setPeriod("weekly")}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  period === "weekly"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                الأسبوعي (هذا الأسبوع)
              </button>

              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  period === "monthly"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                الشهري (هذا الشهر)
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full sm:w-72">
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

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف / المرحلة</th>
                  <th className="p-3 text-center">سجل الحضور</th>
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
                        {item.student.full_name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {item.student.academic_grade || "غير محدد"}
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
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
