"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Copy,
  Check,
  BookOpen,
  Calendar,
  Award,
  Plus,
  ArrowRight,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { GRADE_LABELS, ATTENDANCE_LABELS, LOG_TYPE_LABELS, formatArabicDate } from "@/lib/utils";
import { deleteMemorizationLog } from "@/lib/actions/log";
import { LogEntryDialog } from "./LogEntryDialog";
import { AttendanceDialog } from "./AttendanceDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRealtimeSync, RealtimePayload } from "@/lib/hooks/useRealtimeSync";

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
  const [copied, setCopied] = useState(false);
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

  const handleCopyParentLink = async () => {
    const parentUrl = `${window.location.origin}/parent/${student.parent_token}`;
    try {
      await navigator.clipboard.writeText(parentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = parentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <div className="space-y-6">
      {notification && (
        <div className="p-3 bg-teal-800 text-white font-bold text-xs rounded-xl shadow-lg animate-in slide-in-from-top duration-300 flex items-center justify-center gap-2">
          <span>{notification}</span>
        </div>
      )}

      {/* Top Back Navigation */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة الطلاب</span>
        </Link>
      </div>

      {/* Student Profile Header Card */}
      <Card className="border-teal-200 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white shadow-xl">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center font-bold shadow-inner shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">{student.full_name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-teal-200 mt-2">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>هاتف ولي الأمر: </span>
                  <strong dir="ltr" className="font-mono text-white">
                    {student.parent_phone || "غير مسجل"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <Button
              variant={copied ? "default" : "secondary"}
              onClick={handleCopyParentLink}
              className="gap-2 shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ رابط ولي الأمر</span>
                </>
              )}
            </Button>

            <Link href={`/parent/${student.parent_token}`} target="_blank">
              <Button variant="outline" className="w-full gap-2 border-teal-300/40 text-white hover:bg-white/10">
                <ExternalLink className="w-4 h-4" />
                <span>معاينة البوابة</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-slate-500 font-normal">إجمالي عمليات التسميع</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-3xl font-black text-teal-700">{totalLogsCount}</span>
            <BookOpen className="w-6 h-6 text-teal-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-slate-500 font-normal">نسبة انضباط الحضور</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <span className="text-3xl font-black text-teal-700">{attendancePercentage}%</span>
            <Calendar className="w-6 h-6 text-teal-600" />
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-slate-500 font-normal">آخر تسميع مضاف</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {logs.length > 0 ? (
              <div>
                <span className="text-sm font-bold text-slate-800">
                  {logs[0].log_type}: {logs[0].surah_start} ({logs[0].aya_start}) - {logs[0].surah_end} ({logs[0].aya_end})
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatArabicDate(logs[0].created_at)}
                </p>
              </div>
            ) : (
              <span className="text-xs text-slate-400">لا توجد سجلات بعد</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("logs")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-teal-700 text-teal-800 dark:text-teal-300"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>سجل الحفظ والمراجعة ({totalLogsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "attendance"
              ? "border-teal-700 text-teal-800 dark:text-teal-300"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>سجل الحضور والغياب ({attendance.length})</span>
        </button>
      </div>

      {/* Tab 1: Memorization Logs List */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              سجل الحفظ والمراجعة اليومي
            </h3>
            <Button onClick={() => setIsLogDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              <span>إضافة تسميع جديد</span>
            </Button>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => {
                const gradeInfo = GRADE_LABELS[log.grade] || { label: log.grade, color: "" };
                const typeInfo = LOG_TYPE_LABELS[log.log_type] || { label: log.log_type, color: "" };

                return (
                  <Card key={log.id} className="hover:shadow-sm transition-all border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${gradeInfo.color}`}>
                            {gradeInfo.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatArabicDate(log.created_at)}
                          </span>
                        </div>

                        <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                          من سورة <span className="text-teal-700">{log.surah_start}</span> (آية {log.aya_start}) إلى سورة{" "}
                          <span className="text-teal-700">{log.surah_end}</span> (آية {log.aya_end})
                        </div>

                        {log.notes && (
                          <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg mt-1">
                            ملاحظة المعلم: {log.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 shrink-0"
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
            <Card className="p-8 text-center border-dashed">
              <CardContent className="space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-slate-600 font-bold">لا يوجد تسميع مسجل لهذا الطالب بعد</p>
                <Button variant="outline" onClick={() => setIsLogDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              سجل الحضور والغياب
            </h3>
            <Button onClick={() => setIsAttendanceDialogOpen(true)} className="gap-2">
              <Calendar className="w-4 h-4" />
              <span>تسجيل حضور اليوم</span>
            </Button>
          </div>

          {attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.map((att) => {
                const statusInfo = ATTENDANCE_LABELS[att.status] || { label: att.status, color: "" };

                return (
                  <Card key={att.id} className="hover:shadow-sm transition-all border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
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
            <Card className="p-8 text-center border-dashed">
              <CardContent className="space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-slate-600 font-bold">لا يوجد سجل حضور مسجل بعد</p>
                <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(true)} className="gap-2">
                  <Calendar className="w-4 h-4" />
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
