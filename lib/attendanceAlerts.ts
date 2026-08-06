import { StudentRow, AttendanceRecordRow } from "@/types";

export interface AttendanceAlert {
  studentId: string;
  studentName: string;
  parentPhone?: string | null;
  academicGrade?: string | null;
  alertType: "consecutive" | "low_rate";
  reason: string;
  daysCount: number;
  attendanceRate?: number;
  formattedWhatsAppUrl: string;
}

/**
 * Format phone number cleanly for WhatsApp link (wa.me)
 * Strips non-digits, converts Jordanian local 07XXXXXXXX to 9627XXXXXXXX,
 * removes leading 00 or + if present.
 */
export function formatWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let clean = phone.trim().replace(/\D/g, "");

  // Convert Jordanian local format 07XXXXXXXX -> 9627XXXXXXXX
  if (clean.startsWith("07") && clean.length === 10) {
    clean = "962" + clean.substring(1);
  } else if (clean.startsWith("00")) {
    clean = clean.substring(2);
  }

  return clean;
}

/**
 * Generate formatted WhatsApp URL with pre-filled message
 */
export function generateWhatsAppUrl(
  parentPhone: string | null | undefined,
  studentName: string,
  daysCount: number,
  alertType: "consecutive" | "low_rate",
  attendanceRate?: number
): string {
  const cleanPhone = formatWhatsAppPhone(parentPhone);
  if (!cleanPhone) return "";

  let messageText = "";

  if (alertType === "consecutive") {
    messageText = `السلام عليكم ورحمة الله وبركاته، نود إحاطتكم علماً بأن ابننا الطالب (${studentName}) غاب عن الحلقة لـ (${daysCount}) أيام متتالية. نرجو التواصل معنا للاطمئنان عليه. مع الشكر والتقدير.`;
  } else {
    messageText = `السلام عليكم ورحمة الله وبركاته، نود إحاطتكم علماً بأن نسبة حضور ابننا الطالب (${studentName}) انخفضت إلى (${attendanceRate ?? 0}%). نرجو التواصل معنا للاطمئنان عليه. مع الشكر والتقدير.`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Analyze attendance records over active period (last 7 to 30 days) and identify flagged students:
 * 1. 3 or more consecutive unexcused absence days ("غائب").
 * 2. Overall attendance rate dropping below 75% in the active period (min 3 total sessions).
 */
export function getAttendanceAlerts(
  students: StudentRow[],
  attendance: AttendanceRecordRow[]
): AttendanceAlert[] {
  if (!students || students.length === 0 || !attendance || attendance.length === 0) {
    return [];
  }

  const alerts: AttendanceAlert[] = [];

  students.forEach((student) => {
    // Filter attendance for student
    const studentRecords = attendance.filter((a) => a.student_id === student.id);
    if (studentRecords.length === 0) return;

    // Deduplicate by date (keep latest record per date)
    const uniqueByDateMap = new Map<string, AttendanceRecordRow>();
    studentRecords.forEach((rec) => {
      if (!uniqueByDateMap.has(rec.date) || new Date(rec.created_at || 0) > new Date(uniqueByDateMap.get(rec.date)!.created_at || 0)) {
        uniqueByDateMap.set(rec.date, rec);
      }
    });

    // Sort chronologically descending (newest date first)
    const sortedRecords = Array.from(uniqueByDateMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 1. Check Consecutive Absences ("غائب")
    let consecutiveAbsences = 0;
    for (const rec of sortedRecords) {
      const isAbsent = rec.status === "غائب" || (rec.status as string) === "absent";
      if (isAbsent) {
        consecutiveAbsences++;
      } else {
        // Stop at first non-absent record (e.g. حاضر, متأخر, مستأذن)
        break;
      }
    }

    // 2. Check Attendance Rate in active period (last 30 days or all records if fewer)
    const totalSessions = sortedRecords.length;
    const attendedSessions = sortedRecords.filter(
      (r) =>
        r.status === "حاضر" ||
        r.status === "متأخر" ||
        (r.status as string) === "present" ||
        (r.status as string) === "late"
    ).length;

    const rate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

    // Determine alert severity/type
    if (consecutiveAbsences >= 3) {
      const reason = `غائب ${consecutiveAbsences} أيام متتالية`;
      alerts.push({
        studentId: student.id,
        studentName: student.full_name,
        parentPhone: student.parent_phone,
        academicGrade: student.academic_grade,
        alertType: "consecutive",
        reason,
        daysCount: consecutiveAbsences,
        attendanceRate: rate,
        formattedWhatsAppUrl: generateWhatsAppUrl(
          student.parent_phone,
          student.full_name,
          consecutiveAbsences,
          "consecutive",
          rate
        ),
      });
    } else if (totalSessions >= 3 && rate < 75) {
      const reason = `نسبة الحضور ${rate}%`;
      alerts.push({
        studentId: student.id,
        studentName: student.full_name,
        parentPhone: student.parent_phone,
        academicGrade: student.academic_grade,
        alertType: "low_rate",
        reason,
        daysCount: totalSessions - attendedSessions,
        attendanceRate: rate,
        formattedWhatsAppUrl: generateWhatsAppUrl(
          student.parent_phone,
          student.full_name,
          totalSessions - attendedSessions,
          "low_rate",
          rate
        ),
      });
    }
  });

  return alerts;
}

/**
 * Return a Map of studentId -> AttendanceAlert for fast O(1) lookup
 */
export function getAttendanceAlertsMap(
  students: StudentRow[],
  attendance: AttendanceRecordRow[]
): Map<string, AttendanceAlert> {
  const alerts = getAttendanceAlerts(students, attendance);
  const map = new Map<string, AttendanceAlert>();
  alerts.forEach((alert) => {
    map.set(alert.studentId, alert);
  });
  return map;
}
