import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { StudentReportItem } from "@/components/dashboard/PrintReportView";

export type PeriodType = "daily" | "weekly" | "monthly";

export interface TimeframeDateBounds {
  startOfDay: Date;
  startOfWeek: Date;
  startOfMonth: Date;
  now: Date;
  todayStr: string;
  startOfWeekStr: string;
  startOfMonthStr: string;
}

/**
 * Returns exact start and end boundaries for Daily, Weekly (Sunday 00:00:00), and Monthly (1st of month 00:00:00).
 */
export function getTimeframeDateBounds(referenceDate = new Date()): TimeframeDateBounds {
  const now = new Date(referenceDate);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  // Start of today: 00:00:00
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // Start of week: Sunday (الأحد 00:00:00)
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
  const wYear = startOfWeek.getFullYear();
  const wMonth = String(startOfWeek.getMonth() + 1).padStart(2, "0");
  const wDay = String(startOfWeek.getDate()).padStart(2, "0");
  const startOfWeekStr = `${wYear}-${wMonth}-${wDay}`;

  // Start of month: 1st of current calendar month at 00:00:00
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfMonthStr = `${year}-${month}-01`;

  return {
    startOfDay,
    startOfWeek,
    startOfMonth,
    now,
    todayStr,
    startOfWeekStr,
    startOfMonthStr,
  };
}

/**
 * Cleanly formats page numbers without floating point noise.
 * Rounds to nearest quarter-page (e.g. 3.25, 3.5, 3.75, 4).
 */
export function formatCleanPageCount(totalPages: number): number {
  if (!totalPages || isNaN(totalPages) || totalPages <= 0) return 0;
  const rounded = Math.round(totalPages * 4) / 4;
  return Number(rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.[1-9])0$/, "$1"));
}

/**
 * Single source of truth calculation for student summary reports
 * across any custom date range (e.g. from 2026-07-01 to 2026-08-15).
 */
export function calculateStudentReportItems(
  students: StudentRow[],
  logs: MemorizationLogRow[],
  attendance: AttendanceRecordRow[],
  startDate: string,
  endDate: string
): StudentReportItem[] {
  // Ensure valid date range order
  const actualStart = startDate <= endDate ? startDate : endDate;
  const actualEnd = startDate <= endDate ? endDate : startDate;

  // Calculate unique session dates held across the halaqah for the selected period
  const sessionDates = new Set<string>();
  attendance.forEach((a) => {
    if (!a.date) return;
    if (a.date >= actualStart && a.date <= actualEnd) {
      sessionDates.add(a.date);
    }
  });
  const totalHalaqahSessions = sessionDates.size;

  const items: StudentReportItem[] = students.map((student) => {
    // 1. Filter student logs within exact date boundaries
    const studentLogs = logs.filter((l) => {
      if (l.student_id !== student.id) return false;
      const logDate = l.date || (l.created_at ? l.created_at.substring(0, 10) : "");
      if (!logDate) return false;
      return logDate >= actualStart && logDate <= actualEnd;
    });

    const rawTotalPages = studentLogs.reduce((sum, l) => {
      const p = Number(l.page_count ?? 1);
      return sum + (isNaN(p) ? 0 : p);
    }, 0);

    const cleanPages = formatCleanPageCount(rawTotalPages);

    // 2. Filter student attendance within exact date boundaries
    const studentAttendance = attendance.filter((a) => {
      if (!a.date || a.student_id !== student.id) return false;
      return a.date >= actualStart && a.date <= actualEnd;
    });

    // Deduplicate student attendance by date
    const uniqueAttendanceMap = new Map<string, AttendanceRecordRow>();
    studentAttendance.forEach((rec) => {
      uniqueAttendanceMap.set(rec.date, rec);
    });
    const uniqueList = Array.from(uniqueAttendanceMap.values());

    const presentDays = uniqueList.filter(
      (a) =>
        a.status === "حاضر" ||
        a.status === "متأخر" ||
        (a.status as string) === "present" ||
        (a.status as string) === "late"
    ).length;

    let attendanceText = "لم يرصد";
    let badgeStyle =
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";

    const isSingleDay = actualStart === actualEnd;

    if (isSingleDay) {
      if (uniqueList.length > 0) {
        const status = uniqueList[0].status;
        if (status === "حاضر" || (status as string) === "present") {
          attendanceText = "حاضر";
          badgeStyle =
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800";
        } else if (status === "غائب" || (status as string) === "absent") {
          attendanceText = "غائب";
          badgeStyle =
            "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800";
        } else if (status === "مستأذن" || (status as string) === "excused") {
          attendanceText = "مستأذن";
          badgeStyle =
            "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
        } else if (status === "متأخر" || (status as string) === "late") {
          attendanceText = "متأخر";
          badgeStyle =
            "bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300 dark:border-teal-800";
        } else {
          attendanceText = String(status);
          badgeStyle =
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
        }
      } else {
        attendanceText = "لم يرصد";
        badgeStyle =
          "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
      }
    } else {
      const totalSessions = Math.max(totalHalaqahSessions, uniqueList.length);
      if (totalSessions > 0) {
        const percentage = Math.round((presentDays / totalSessions) * 100);
        attendanceText = `${presentDays} / ${totalSessions} (${percentage}%)`;
        if (percentage >= 85) {
          badgeStyle =
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800";
        } else if (percentage >= 60) {
          badgeStyle =
            "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
        } else {
          badgeStyle =
            "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800";
        }
      } else {
        attendanceText = "0 / 0 (0%)";
        badgeStyle =
          "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
      }
    }

    return {
      student,
      attendanceText,
      badgeStyle,
      pagesCount: cleanPages,
      totalPresentCount: presentDays,
    };
  });

  // Sort descending by total recitation pages (highest first).
  // Secondary sort by student name in Arabic to ensure deterministic stable ordering.
  return items.sort((a, b) => {
    if (b.pagesCount !== a.pagesCount) {
      return b.pagesCount - a.pagesCount;
    }
    return (a.student.full_name || "").localeCompare(b.student.full_name || "", "ar");
  });
}
