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
import {
  calculateStudentReportItems,
  getTimeframeDateBounds,
  PeriodType,
} from "@/lib/reportCalculations";

const PrintReportView = dynamic(() => import("./PrintReportView").then((mod) => mod.PrintReportView), { ssr: false });

interface SummaryReportTableProps {
  students: StudentRow[];
  logs: MemorizationLogRow[];
  attendance: AttendanceRecordRow[];
}

export type { PeriodType };

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
    return getTimeframeDateBounds();
  }, []);

  // Map student IDs to active absence alerts
  const alertsMap = useMemo(() => {
    return getAttendanceAlertsMap(students, localAttendance);
  }, [students, localAttendance]);

  // Unified single-source-of-truth calculation for both on-screen and printable report
  const reportItems: StudentReportItem[] = useMemo(() => {
    return calculateStudentReportItems(students, logs, localAttendance, period, dateBounds);
  }, [students, logs, localAttendance, period, dateBounds]);

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
                          <span className="text-slate-400 font-bold">0 صفحة</span>
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

