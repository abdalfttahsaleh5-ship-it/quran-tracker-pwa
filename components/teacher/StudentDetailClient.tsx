"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Phone,
  BookOpen,
  Calendar,
  Plus,
  ArrowRight,
  Trash2,
  ExternalLink,
  Award,
  BookCheck,
  Sparkles,
} from "lucide-react";
import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { GRADE_LABELS, ATTENDANCE_LABELS, LOG_TYPE_LABELS, formatArabicDate, formatPageCount } from "@/lib/utils";
import { deleteMemorizationLog } from "@/lib/actions/log";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRealtimeSync, RealtimePayload } from "@/lib/hooks/useRealtimeSync";

const LogEntryDialog = dynamic(() => import("./LogEntryDialog").then((mod) => mod.LogEntryDialog), { ssr: false });
const AttendanceDialog = dynamic(() => import("./AttendanceDialog").then((mod) => mod.AttendanceDialog), { ssr: false });

interface StudentDetailClientProps {
  student: StudentRow;
  initialLogs: MemorizationLogRow[];
  initialAttendance: AttendanceRecordRow[];
}

export function StudentDetailClient({
  student,
  initialLogs,
  initialAttendance,
}: StudentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "attendance">("logs");
  const [logs, setLogs] = useState<MemorizationLogRow[]>(initialLogs);
  const [attendance, setAttendance] = useState<AttendanceRecordRow[]>(initialAttendance);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);

  // Realtime Payload Handler for Instant Client State Update
  const handleRealtimePayload = useCallback(
    (payload: RealtimePayload) => {
      const { table, eventType, new: newRecord, old: oldRecord } = payload;

      if (table === "memorization_logs") {
        if (eventType === "INSERT" && newRecord && newRecord.student_id === student.id) {
          setLogs((prev) => [newRecord as unknown as MemorizationLogRow, ...prev.filter((l) => l.id !== newRecord.id)]);
        } else if (eventType === "DELETE" && oldRecord && oldRecord.id) {
          setLogs((prev) => prev.filter((l) => l.id !== oldRecord.id));
        } else if (eventType === "UPDATE" && newRecord && newRecord.student_id === student.id) {
          setLogs((prev) =>
            prev.map((l) => (l.id === newRecord.id ? (newRecord as unknown as MemorizationLogRow) : l))
          );
        }
      }

      if (table === "attendance_records") {
        if ((eventType === "INSERT" || eventType === "UPDATE") && newRecord && newRecord.student_id === student.id) {
          setAttendance((prev) => {
            const exists = prev.some((a) => a.id === newRecord.id || a.date === newRecord.date);
            if (exists) {
              return prev.map((a) =>
                a.id === newRecord.id || a.date === newRecord.date ? (newRecord as unknown as AttendanceRecordRow) : a
              );
            }
            return [newRecord as unknown as AttendanceRecordRow, ...prev];
          });
        } else if (eventType === "DELETE" && oldRecord && oldRecord.id) {
          setAttendance((prev) => prev.filter((a) => a.id !== oldRecord.id));
        }
      }
    },
    [student.id]
  );

  const { notification } = useRealtimeSync({
    tables: ["memorization_logs", "attendance_records"],
    onPayload: handleRealtimePayload,
  });

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا التسميع؟")) return;
    const res = await deleteMemorizationLog(logId, student.id);
    if (res.success) {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    }
  };

  // Calculate stats
  const totalLogsCount = logs.length;
  const presentCount = attendance.filter((a) => a.status === "حاضر" || a.status === "متأخر").length;
  const attendancePercentage =
    attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {notification && (
        <div className="p-3 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg animate-in slide-in-from-top duration-300 flex items-center justify-center gap-2">
          <span>{notification}</span>
        </div>
      )}

      {/* Top Back Navigation */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة الطلاب</span>
        </Link>
      </div>

      {/* Redesigned Student Profile Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/40">
        {/* Decorative Pattern Background Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        {/* Radial Glow Overlay */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6 text-center sm:text-right">
            {/* Significantly Enlarged Student Profile Picture */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg shrink-0 overflow-hidden border-2 border-white/20">
              {student.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
              ) : (
                <span>{student.full_name.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/60 border border-emerald-700/60 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                <span>ملف الطالب</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{student.full_name}</h2>

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-xs text-emerald-200/90 font-medium">
                {student.parent_phone && (
                  <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                    <Phone className="w-3 h-3 text-amber-300" />
                    <strong dir="ltr" className="font-mono text-white">
                      {student.parent_phone}
                    </strong>
                  </span>
                )}

                {student.academic_grade && (
                  <span className="bg-white/10 px-2.5 py-1 rounded-xl font-bold border border-white/10">
                    🎓 {student.academic_grade}
                  </span>
                )}

                {student.school_name && (
                  <span className="bg-white/10 px-2.5 py-1 rounded-xl font-medium border border-white/10">
                    🏫 {student.school_name}
                  </span>
                )}

                {student.father_job && (
                  <span className="bg-white/10 px-2.5 py-1 rounded-xl font-medium border border-white/10">
                    💼 مهنة الوالد: {student.father_job}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <Button
              size="lg"
              onClick={() => setIsLogDialogOpen(true)}
              className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5 text-slate-950" />
              <span>تسجيل تسميع جديد 📖</span>
            </Button>

            <Link href={`/parent/${student.parent_token}`} target="_blank" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-emerald-900/60 border-emerald-700/70 text-emerald-100 hover:bg-emerald-800/80 font-bold rounded-2xl gap-2"
              >
                <ExternalLink className="w-4 h-4 text-amber-300" />
                <span>معاينة البوابة 🌐</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Unified Single-Row 3-Column KPI Stats Grid */}
      <div className="stats-grid no-print print:hidden grid grid-cols-3 gap-2 sm:gap-4">
        {/* Metric 1: Total Recitations */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي التسميعات
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {totalLogsCount}
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              عملية موثقة
            </CardDescription>
          </CardContent>
        </Card>

        {/* Metric 2: Attendance Rate */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              نسبة الحضور
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {attendancePercentage}%
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              انضباط بالحضور
            </CardDescription>
          </CardContent>
        </Card>

        {/* Metric 3: Latest Recitation */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              آخر تسميع
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {logs.length > 0 ? (
              <div className="truncate">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {logs[0].surah_start} ({logs[0].aya_start})
                </div>
                <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  {formatArabicDate(logs[0].created_at)}
                </CardDescription>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-bold mt-1">—</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => React.startTransition(() => setActiveTab("logs"))}
          className={`py-3 px-5 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>سجل الحفظ والمراجعة ({totalLogsCount})</span>
        </button>

        <button
          onClick={() => React.startTransition(() => setActiveTab("attendance"))}
          className={`py-3 px-5 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "attendance"
              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>سجل الحضور والغياب ({attendance.length})</span>
        </button>
      </div>

      {/* Tab 1: Memorization Logs List / Timeline */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50">
              سجل التسميعات اليومية 📜
            </h3>
            <Button
              onClick={() => setIsLogDialogOpen(true)}
              size="sm"
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تسميع</span>
            </Button>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => {
                const gradeInfo = GRADE_LABELS[log.grade] || { label: log.grade, color: "" };
                const typeInfo = LOG_TYPE_LABELS[log.log_type] || { label: log.log_type, color: "" };

                return (
                  <Card key={log.id} className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800 rounded-2xl">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${gradeInfo.color}`}>
                            {gradeInfo.label}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                            📖 {formatPageCount(log.page_count)}
                          </span>
                          {log.assistant_name && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              👤 المسمّع: {log.assistant_name}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-bold">
                            {formatArabicDate(log.created_at)}
                          </span>
                        </div>

                        <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                          من سورة <span className="text-emerald-700 dark:text-emerald-400">{log.surah_start}</span> (آية {log.aya_start}) إلى سورة{" "}
                          <span className="text-emerald-700 dark:text-emerald-400">{log.surah_end}</span> (آية {log.aya_end})
                        </div>

                        {log.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 mt-1">
                            ملاحظة المعلم: {log.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 shrink-0 rounded-xl"
                        title="حذف التسميع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed rounded-3xl">
              <CardContent className="space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-bold text-sm">لا يوجد تسميع مسجل لهذا الطالب بعد</p>
                <Button variant="outline" onClick={() => setIsLogDialogOpen(true)} className="gap-2 rounded-xl">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>سجل أول تسميع الآن</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Attendance History List */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50">
              سجل الحضور والغياب 📅
            </h3>
            <Button
              onClick={() => setIsAttendanceDialogOpen(true)}
              size="sm"
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
            >
              <Calendar className="w-4 h-4" />
              <span>تسجيل حضور</span>
            </Button>
          </div>

          {attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.map((att) => {
                const statusInfo = ATTENDANCE_LABELS[att.status] || { label: att.status, color: "" };

                return (
                  <Card key={att.id} className="hover:shadow-sm transition-all border-slate-200 dark:border-slate-800 rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                            {formatArabicDate(att.date)}
                          </span>
                        </div>
                        {att.notes && (
                          <p className="text-xs text-slate-500 mt-1">ملاحظات: {att.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed rounded-3xl">
              <CardContent className="space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-bold text-sm">لا يوجد سجل حضور مسجل بعد</p>
                <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(true)} className="gap-2 rounded-xl">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>سجل حضور اليوم</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog Modals */}
      <LogEntryDialog
        isOpen={isLogDialogOpen}
        onClose={() => setIsLogDialogOpen(false)}
        studentId={student.id}
        studentName={student.full_name}
        onSuccess={(newLog) => {
          setLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id)]);
        }}
      />

      <AttendanceDialog
        isOpen={isAttendanceDialogOpen}
        onClose={() => setIsAttendanceDialogOpen(false)}
        studentId={student.id}
        studentName={student.full_name}
        onSuccess={(newRecord) => {
          setAttendance((prev) => {
            const exists = prev.some((a) => a.id === newRecord.id || a.date === newRecord.date);
            if (exists) {
              return prev.map((a) =>
                a.id === newRecord.id || a.date === newRecord.date ? newRecord : a
              );
            }
            return [newRecord, ...prev];
          });
        }}
      />
    </div>
  );
}
