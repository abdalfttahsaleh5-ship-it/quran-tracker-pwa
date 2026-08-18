"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { User, Phone, Copy, Check, Edit3, Trash2, ExternalLink, BookOpen, MessageSquare, AlertTriangle, Zap } from "lucide-react";
import { StudentRow, AttendanceRecordRow, MemorizationLogRow } from "@/types";
import { AttendanceAlert } from "@/lib/attendanceAlerts";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { lightHaptic, successHaptic } from "@/lib/haptics";
import { generateWhatsAppShareUrl } from "@/lib/whatsappUtils";
import Link from "next/link";

const QuickRecitationSheet = dynamic(
  () => import("./QuickRecitationSheet").then((mod) => mod.QuickRecitationSheet),
  { ssr: false }
);

interface StudentCardProps {
  student: StudentRow;
  logs?: MemorizationLogRow[] | any[];
  attendance?: AttendanceRecordRow[];
  alert?: AttendanceAlert;
  weeklyTopStudentId?: string;
  onEdit: (student: StudentRow) => void;
  onDelete: (student: StudentRow) => void;
}

export function StudentCard({ student, logs, attendance, alert, weeklyTopStudentId, onEdit, onDelete }: StudentCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isQuickRecitationOpen, setIsQuickRecitationOpen] = useState(false);

  // Use pre-aggregated completed pages directly from student view
  const totalCompletedPages = Number(
    student.total_pages_memorized ?? student.total_pages_count ?? 0
  );

  const formattedPages = totalCompletedPages.toFixed(1).replace(/\.0$/, "");

  // Determine the most recent Surah for quick default selection
  const latestSurah = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    const studentLogs = logs.filter((l) => l.student_id === student.id);
    if (studentLogs.length === 0) return null;
    const sorted = [...studentLogs].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    return sorted[0]?.surah_end || sorted[0]?.surah_start || null;
  }, [logs, student.id]);

  // Determine attendance rate for WhatsApp report
  const monthlyAttendanceRate = useMemo(() => {
    if (!attendance || attendance.length === 0) return 100;
    const studentAttendance = attendance.filter((a) => a.student_id === student.id);
    if (studentAttendance.length === 0) return 100;
    const presentCount = studentAttendance.filter(
      (a) =>
        a.status === "حاضر" ||
        a.status === "متأخر" ||
        (a.status as string) === "present" ||
        (a.status as string) === "late"
    ).length;
    return Math.round((presentCount / studentAttendance.length) * 100);
  }, [attendance, student.id]);

  const handleCopyParentLink = async () => {
    lightHaptic();
    const parentUrl = `${window.location.origin}/parent/${student.parent_token}`;
    try {
      await navigator.clipboard.writeText(parentUrl);
      setCopied(true);
      successHaptic();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = parentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      successHaptic();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectWhatsApp = () => {
    lightHaptic();
    successHaptic();
    const url = generateWhatsAppShareUrl(student, totalCompletedPages, monthlyAttendanceRate, latestSurah);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Card className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold overflow-hidden border border-teal-200 shrink-0 shadow-inner">
              {student.avatar_url && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.avatar_url}
                  alt={student.full_name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base select-none">{student.full_name.charAt(0)}</span>
              )}
            </div>
            <div>
              <Link href={`/students/${student.id}`} prefetch={false} className="hover:underline">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 flex-wrap">
                  <span>{student.full_name}</span>
                  {student.academic_grade && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200">
                      {student.academic_grade}
                    </span>
                  )}
                  {alert && (
                    <span
                      title={alert.reason}
                      className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shrink-0"
                    >
                      ⚠️ {alert.reason}
                    </span>
                  )}
                </CardTitle>
              </Link>
              <p className="text-xs text-slate-400 mt-0.5">
                تم التسجيل: {new Date(student.created_at).toLocaleDateString("ar-JO")}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2 text-sm space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 p-2 rounded-lg border border-teal-100 dark:border-teal-900">
            <span>📚 مجموع التسميع المنجز:</span>
            <span className="font-mono text-sm font-black">{formattedPages} صفحة</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 pt-1">
            <Phone className="w-4 h-4 text-teal-600 shrink-0" />
            <span>هاتف ولي الأمر: </span>
            <span dir="ltr" className="font-mono text-slate-800 dark:text-slate-200">
              {student.parent_phone || "غير مسجل"}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          {/* PRIMARY ACTION: 2-Click Quick Recitation Sheet */}
          <Button
            variant="default"
            size="default"
            onClick={() => {
              lightHaptic();
              setIsQuickRecitationOpen(true);
            }}
            className="w-full min-h-[44px] gap-2 font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-teal-700/20 active:scale-[0.98] transition-all rounded-xl"
          >
            <Zap className="w-4 h-4 fill-current text-amber-300" />
            <span>⚡ تسميع سريع (2-Clicks)</span>
          </Button>

          {/* Secondary Action: Open Full Profile */}
          <Link href={`/students/${student.id}`} prefetch={false} className="w-full">
            <Button variant="outline" size="sm" className="w-full gap-2 font-bold text-xs text-slate-700 dark:text-slate-200">
              <BookOpen className="w-3.5 h-3.5" />
              <span>عرض الملف والتسميع اليومي</span>
            </Button>
          </Link>

          {/* WhatsApp 1-Click & Parent Link Actions Grid */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* Direct WhatsApp Action (1-Click) */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDirectWhatsApp}
              className="gap-1.5 font-bold text-xs bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-all truncate"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">📱 واتساب (1-Click)</span>
            </Button>

            {/* Copy Parent Link Button */}
            <Button
              variant={copied ? "default" : "outline"}
              size="sm"
              onClick={handleCopyParentLink}
              className={`gap-1.5 font-bold text-xs transition-all truncate ${
                copied ? "bg-emerald-600 text-white hover:bg-emerald-700" : "text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-900"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">نسخ الرابط 📋</span>
                </>
              )}
            </Button>
          </div>

          {/* Bottom Action Row: Preview Portal, Edit, Delete */}
          <div className="flex items-center justify-between w-full pt-1">
            <Link href={`/parent/${student.parent_token}`} prefetch={false} target="_blank">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-teal-700 hover:text-teal-800">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة البوابة</span>
              </Button>
            </Link>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(student)}
                title="تعديل البيانات"
                className="h-8 w-8 text-slate-600 hover:text-teal-700"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(student)}
                title="حذف الطالب"
                className="h-8 w-8 text-slate-600 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Quick Recitation Bottom Sheet */}
      <QuickRecitationSheet
        isOpen={isQuickRecitationOpen}
        onClose={() => setIsQuickRecitationOpen(false)}
        studentId={student.id}
        studentName={student.full_name}
        latestSurah={latestSurah}
      />
    </>
  );
}
