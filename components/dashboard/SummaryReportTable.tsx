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
import { recordAttendance } from "@/lib/actions/attendance";
import { lightHaptic, successHaptic } from "@/lib/haptics";
import { queuePendingAction } from "@/lib/offlineQueue";
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
  // Default date bounds (1st day of current month to today)
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const firstDayOfMonthStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }, []);

  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [localAttendance, setLocalAttendance] = useState<AttendanceRecordRow[]>(attendance);

  // Synchronize local state when attendance prop changes
  useEffect(() => {
    setLocalAttendance(attendance);
  }, [attendance]);

  // Realtime Payload Handler for immediate synchronization
  const handleRealtimePayload = useCallback((payload: RealtimePayload<AttendanceRecordRow>) => {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    if (table === "attendance_records") {
      if ((eventType === "INSERT" || eventType === "UPDATE") && newRecord) {
        const rec = newRecord;
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
    return calculateStudentReportItems(students, logs, localAttendance, startDate, endDate);
  }, [students, logs, localAttendance, startDate, endDate]);

  // Filter report items by search query
  const filteredReportItems = useMemo(() => {
    if (!searchQuery.trim()) return reportItems;
    const q = searchQuery.trim().toLowerCase();
    return reportItems.filter((item) => item.student.full_name.toLowerCase().includes(q));
  }, [reportItems, searchQuery]);

  const periodLabel = useMemo(() => {
    if (startDate === endDate) {
      return `تقرير يوم: ${startDate}`;
    }
    return `الفترة المخصصة: من ${startDate} إلى ${endDate}`;
  }, [startDate, endDate]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Instant 0ms toggle attendance handler for daily view
  const handleToggleAttendance = (studentId: string) => {
    lightHaptic();
    const dateStr = dateBounds.todayStr;

    const todayRecord = localAttendance.find(
      (a) => a.student_id === studentId && a.date === dateStr
    );
    const currentStatus = todayRecord?.status;
    const isCurrentlyPresent = currentStatus === "حاضر" || (currentStatus as string) === "present";
    const nextStatus = isCurrentlyPresent ? "غائب" : "حاضر";

    // 1. Optimistic 0ms instant local state update
    setLocalAttendance((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.student_id === studentId && a.date === dateStr
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          status: nextStatus,
        };
        return copy;
      }
      return [
        {
          id: `temp_${Date.now()}_${studentId}`,
          student_id: studentId,
          teacher_id: "current",
          date: dateStr,
          status: nextStatus,
          notes: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ];
    });

    // 2. Fire async background upsert call without blocking UI
    if (typeof window !== "undefined" && !navigator.onLine) {
      queuePendingAction("attendance", [{ student_id: studentId, date: dateStr, status: nextStatus }]);
      return;
    }

    recordAttendance({
      student_id: studentId,
      date: dateStr,
      status: nextStatus,
    }).catch((err) => {
      console.warn("Background attendance toggle error:", err);
    });
  };

  return (
    <>
      {/* Print-only View Component */}
      <PrintReportView reportItems={filteredReportItems} periodLabel={periodLabel} />

      {/* Screen Interactive Dashboard Card */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm print:hidden">
        <CardHeader className="p-3.5 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-2 sm:gap-4">
          <div>
            <CardTitle className="text-sm sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              <span>تقرير متابعة طلاب الحلقة 📊</span>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
              إحصائيات الحضور والصفحات حسب الفترة المحددة
            </CardDescription>
          </div>

          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-1.5 sm:gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-bold rounded-xl shrink-0 text-xs sm:text-sm py-1.5 px-2.5 sm:py-2 sm:px-3"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">تصدير تقرير الإدارة (PDF / طباعة) 🖨️</span>
            <span className="sm:hidden">طباعة 🖨️</span>
          </Button>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
          {/* Custom Date Range Controls & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
            {/* Custom Date Range Selector */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-200 px-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>فترة مخصصة:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 shadow-sm">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">من</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  />
                </div>

                <span className="text-slate-400 font-bold text-xs">—</span>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 shadow-sm">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">إلى</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="ابحث باسم الطالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Responsive Table Container with natural vertical page scroll and horizontal table scroll */}
          <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[540px] sm:min-w-full text-right text-[11px] sm:text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs">
                <tr>
                  <th className="p-2 sm:p-3 text-center w-8 sm:w-10">#</th>
                  <th className="p-2 sm:p-3 min-w-[120px] sm:min-w-[150px]">اسم الطالب</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">الصف الدراسي</th>
                  <th className="p-2 sm:p-3 text-center whitespace-nowrap">حالة الحضور</th>
                  <th className="p-2 sm:p-3 text-center whitespace-nowrap">إجمالي الصفحات</th>
                  <th className="p-2 sm:p-3 text-center whitespace-nowrap">ولي الأمر</th>
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
                      <td className="p-2 sm:p-3 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="p-2 sm:p-3 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/students/${item.student.id}`}
                            className="hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline transition-colors break-words line-clamp-2 sm:line-clamp-none"
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
                      <td className="p-2 sm:p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[10px] sm:text-xs">
                        {item.student.academic_grade || "غير محدد"}
                      </td>
                      <td className="p-2 sm:p-3 text-center font-bold whitespace-nowrap">
                        {startDate === endDate && startDate === dateBounds.todayStr ? (
                          (() => {
                            const todayRecord = localAttendance.find(
                              (a) => a.student_id === item.student.id && a.date === dateBounds.todayStr
                            );
                            const status = todayRecord?.status;
                            const isPresent = status === "حاضر" || (status as string) === "present";
                            const isAbsent = status === "غائب" || (status as string) === "absent";

                            if (isPresent) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(item.student.id)}
                                  className="inline-flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm transition-all cursor-pointer select-none"
                                  title="حاضر - انقر للتبديل إلى غائب"
                                >
                                  <span>🟢 حاضر</span>
                                </button>
                              );
                            }

                            if (isAbsent) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(item.student.id)}
                                  className="inline-flex items-center justify-center gap-1 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm transition-all cursor-pointer select-none"
                                  title="غائب - انقر للتبديل إلى حاضر"
                                >
                                  <span>🔴 غائب</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => handleToggleAttendance(item.student.id)}
                                className="inline-flex items-center justify-center gap-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer select-none font-bold"
                                title="لم يرصد - انقر للتبديل إلى حاضر"
                              >
                                <span>⚪ لم يرصد</span>
                              </button>
                            );
                          })()
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black ${
                              item.attendanceText.includes("/") ? "dir-ltr" : "dir-rtl"
                            } ${
                              item.badgeStyle || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {item.attendanceText}
                          </span>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 text-center font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {item.pagesCount > 0 ? (
                          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-xs font-black">
                            📖 {item.pagesCount} صفحة
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px] sm:text-xs">0 صفحة</span>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 text-center whitespace-nowrap">
                        {item.student.parent_phone ? (
                          <span className="font-mono text-slate-600 dark:text-slate-400 dir-ltr inline-block text-[10px] sm:text-xs">
                            {item.student.parent_phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
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

