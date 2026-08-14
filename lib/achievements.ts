import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { getTimeframeDateBounds, formatCleanPageCount } from "@/lib/reportCalculations";
import { getStudentMemorizedSurahsMap, SURAH_METADATA, normalizeSurahName } from "@/lib/quranMetadata";

export interface StudentBadge {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgGradient: string;
  description: string;
  isUnlocked: boolean;
  progressText?: string;
}

/**
 * Calculates digital gamification achievement badges for a student.
 */
export function calculateStudentBadges(
  student: StudentRow,
  logs: MemorizationLogRow[] = [],
  attendanceRecords: AttendanceRecordRow[] = [],
  weeklyTopStudentId?: string
): StudentBadge[] {
  const studentLogs = logs.filter((l) => l.student_id === student.id);
  const studentAttendance = attendanceRecords.filter((a) => a.student_id === student.id);

  // 1. Total Completed Pages
  const rawTotalPages = studentLogs.reduce((sum, l) => {
    const p = Number(l.page_count ?? 1);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);
  const totalPages = formatCleanPageCount(rawTotalPages);

  // 2. Juz 30 Pages (Surah 78 to 114)
  const memMap = getStudentMemorizedSurahsMap(studentLogs, student.id);
  let juz30Pages = 0;
  const juz30Surahs = SURAH_METADATA.filter((s) => s.id >= 78);
  for (const surah of juz30Surahs) {
    if (memMap.has(normalizeSurahName(surah.name))) {
      juz30Pages += surah.standardPages;
    }
  }
  const cleanJuz30Pages = formatCleanPageCount(juz30Pages);

  // 3. Monthly Attendance Rate
  const bounds = getTimeframeDateBounds();
  const monthlyRecords = studentAttendance.filter(
    (a) => a.date >= bounds.startOfMonthStr && a.date <= bounds.todayStr
  );
  // Deduplicate records by date
  const uniqueDatesMap = new Map<string, AttendanceRecordRow>();
  monthlyRecords.forEach((r) => uniqueDatesMap.set(r.date, r));
  const uniqueMonthly = Array.from(uniqueDatesMap.values());

  const presentCount = uniqueMonthly.filter(
    (a) =>
      a.status === "حاضر" ||
      a.status === "متأخر" ||
      (a.status as string) === "present" ||
      (a.status as string) === "late"
  ).length;

  const totalMonthlySessions = uniqueMonthly.length;
  const isPerfectAttendance = totalMonthlySessions >= 3 && presentCount === totalMonthlySessions;

  // 4. Badges Definition
  const badges: StudentBadge[] = [
    {
      id: "juz_30",
      title: "ختام جزء عمّ",
      icon: "🌟",
      color: "text-amber-500 border-amber-300 dark:border-amber-700",
      bgGradient: "from-amber-500/20 via-amber-400/10 to-amber-500/5",
      description: "إتمام حفظ سور جزء عمّ كاملاً (23 صفحة)",
      isUnlocked: cleanJuz30Pages >= 23 || totalPages >= 23,
      progressText: `${cleanJuz30Pages} / 23 صفحة`,
    },
    {
      id: "top_reciter",
      title: "حافظ متميز",
      icon: "🚀",
      color: "text-emerald-600 border-emerald-300 dark:border-emerald-700",
      bgGradient: "from-emerald-500/20 via-emerald-400/10 to-emerald-500/5",
      description: "إنجاز تسميع أكثر من 10 صفحات بنجاح",
      isUnlocked: totalPages >= 10,
      progressText: `${totalPages} / 10 صفحات`,
    },
    {
      id: "commitment_star",
      title: "نجم الالتزام",
      icon: "🛡️",
      color: "text-blue-600 border-blue-300 dark:border-blue-700",
      bgGradient: "from-blue-500/20 via-blue-400/10 to-blue-500/5",
      description: "حضور كامل بنسبة 100% خلال جلسات هذا الشهر",
      isUnlocked: isPerfectAttendance,
      progressText: `${presentCount} / ${totalMonthlySessions} جلسات (${totalMonthlySessions > 0 ? Math.round((presentCount / totalMonthlySessions) * 100) : 0}%)`,
    },
    {
      id: "weekly_champion",
      title: "متصدر الأسبوع",
      icon: "🏆",
      color: "text-purple-600 border-purple-300 dark:border-purple-700",
      bgGradient: "from-purple-500/20 via-purple-400/10 to-purple-500/5",
      description: "أعلى معدل إنجاز وتسميع في الحلقة لهذا الأسبوع",
      isUnlocked: Boolean(weeklyTopStudentId && weeklyTopStudentId === student.id),
      progressText: weeklyTopStudentId === student.id ? "متصدر الحلقة 🥇" : "تنافس على الصدارة",
    },
    {
      id: "first_step",
      title: "بداية مباركة",
      icon: "🌱",
      color: "text-teal-600 border-teal-300 dark:border-teal-700",
      bgGradient: "from-teal-500/20 via-teal-400/10 to-teal-500/5",
      description: "تسجيل أول تسميع متقن في سجل الحلقة",
      isUnlocked: studentLogs.length > 0,
      progressText: studentLogs.length > 0 ? "تم الانطلاق 🌿" : "بانتظار أول تسميع",
    },
  ];

  return badges;
}
