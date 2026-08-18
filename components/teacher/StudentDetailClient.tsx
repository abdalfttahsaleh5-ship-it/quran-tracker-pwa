"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Pencil,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { GRADE_LABELS, ATTENDANCE_LABELS, LOG_TYPE_LABELS, formatArabicDate, formatPageCount } from "@/lib/utils";
import { deleteMemorizationLog } from "@/lib/actions/log";
import { deleteAttendanceById } from "@/lib/actions/attendance";
import { regenerateParentToken } from "@/lib/actions/student";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRealtimeSync, RealtimePayload } from "@/lib/hooks/useRealtimeSync";
import { lightHaptic, successHaptic } from "@/lib/haptics";
import { ShareAchievementModal } from "./ShareAchievementModal";
import { AudioPlayer } from "@/components/common/AudioPlayer";
import { RecitationLogCard } from "./RecitationLogCard";
import {
  getStudentSurahProgressMap,
  getStudentJuzProgressMap,
  SurahProgressRecord,
  JuzProgressRecord,
} from "@/lib/quranMetadata";

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"logs" | "attendance" | "progress">("logs");
  const [viewMode, setViewMode] = useState<"juz" | "surah">("juz");
  const [expandedJuzId, setExpandedJuzId] = useState<number | null>(null);
  const [showAllProgress, setShowAllProgress] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [editingLog, setEditingLog] = useState<MemorizationLogRow | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  const toggleJuzExpand = (juzNumber: number) => {
    setExpandedJuzId((prev) => (prev === juzNumber ? null : juzNumber));
  };
  const [logs, setLogs] = useState<MemorizationLogRow[]>(initialLogs);
  const [attendance, setAttendance] = useState<AttendanceRecordRow[]>(initialAttendance);
  const [parentToken, setParentToken] = useState<string | null | undefined>(student.parent_token);
  const [isCopiedToken, setIsCopiedToken] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopyParentLink = async () => {
    if (!parentToken) return;
    lightHaptic();
    const portalUrl = `${window.location.origin}/parent/${parentToken}`;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setIsCopiedToken(true);
      successHaptic();
      showToast("تم نسخ رابط متابعة ولي الأمر للحافظة 📋✅");
      setTimeout(() => setIsCopiedToken(false), 2500);
    } catch {
      const input = document.createElement("input");
      input.value = portalUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setIsCopiedToken(true);
      successHaptic();
      showToast("تم نسخ رابط متابعة ولي الأمر للحافظة 📋✅");
      setTimeout(() => setIsCopiedToken(false), 2500);
    }
  };

  const handleRegenerateParentToken = async () => {
    lightHaptic();
    const confirmed = window.confirm(
      "هل أنت متأكد؟ سيتوقف الرابط القديم لولي الأمر فوراً عن العمل وسيتم إنشاء رمز وصول جديد."
    );
    if (!confirmed) return;

    setIsRegeneratingToken(true);
    try {
      const res = await regenerateParentToken(student.id);
      if (res.success && res.data?.parent_token) {
        const newToken = res.data.parent_token;
        setParentToken(newToken);
        const newUrl = `${window.location.origin}/parent/${newToken}`;
        try {
          await navigator.clipboard.writeText(newUrl);
        } catch {
          // ignore clipboard error
        }
        successHaptic();
        showToast("تم تجديد رمز ورابط المتابعة بنجاح ونسخه للحافظة 🔑✅");
      } else {
        alert(res.error || "فشل تجديد رابط المتابعة");
      }
    } catch {
      alert("حدث خطأ أثناء تجديد رابط المتابعة");
    } finally {
      setIsRegeneratingToken(false);
    }
  };

  const surahProgressList = useMemo(() => {
    const map = getStudentSurahProgressMap(logs, student.id);
    return Array.from(map.values()).sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return new Date(b.lastLogDate || 0).getTime() - new Date(a.lastLogDate || 0).getTime();
    });
  }, [logs, student.id]);

  const juzProgressList = useMemo(() => {
    const map = getStudentJuzProgressMap(logs, student.id);
    return Array.from(map.values());
  }, [logs, student.id]);

  const filteredSurahList = useMemo(() => {
    if (statusFilter === "in_progress") {
      return surahProgressList.filter((s) => !s.isCompleted && s.rawRecitedPages > 0);
    }
    if (statusFilter === "completed") {
      return surahProgressList.filter((s) => s.isCompleted);
    }
    return surahProgressList;
  }, [surahProgressList, statusFilter]);

  const filteredJuzList = useMemo(() => {
    if (statusFilter === "in_progress") {
      return juzProgressList.filter((j) => j.status === "in_progress");
    }
    if (statusFilter === "completed") {
      return juzProgressList.filter((j) => j.isCompleted);
    }
    return juzProgressList;
  }, [juzProgressList, statusFilter]);

  const activeAllCount = viewMode === "juz" ? juzProgressList.length : surahProgressList.length;
  const activeInProgressCount = viewMode === "juz"
    ? juzProgressList.filter((j) => j.status === "in_progress").length
    : surahProgressList.filter((s) => !s.isCompleted && s.rawRecitedPages > 0).length;
  const activeCompletedCount = viewMode === "juz"
    ? juzProgressList.filter((j) => j.isCompleted).length
    : surahProgressList.filter((s) => s.isCompleted).length;

  // Realtime Payload Handler for Instant Client State Update
  const handleRealtimePayload = useCallback(
    (payload: RealtimePayload<MemorizationLogRow & AttendanceRecordRow>) => {
      const { table, eventType, new: newRecord, old: oldRecord } = payload;

      if (table === "memorization_logs") {
        const logRec = newRecord as MemorizationLogRow;
        if (eventType === "INSERT" && logRec && logRec.student_id === student.id) {
          setLogs((prev) => [logRec, ...prev.filter((l) => l.id !== logRec.id)]);
        } else if (eventType === "DELETE" && oldRecord && oldRecord.id) {
          setLogs((prev) => prev.filter((l) => l.id !== oldRecord.id));
        } else if (eventType === "UPDATE" && logRec && logRec.student_id === student.id) {
          setLogs((prev) =>
            prev.map((l) => (l.id === logRec.id ? logRec : l))
          );
        }
      }

      if (table === "attendance_records") {
        const attRec = newRecord as AttendanceRecordRow;
        if ((eventType === "INSERT" || eventType === "UPDATE") && attRec && attRec.student_id === student.id) {
          setAttendance((prev) => {
            const exists = prev.some((a) => a.id === attRec.id || a.date === attRec.date);
            if (exists) {
              return prev.map((a) =>
                a.id === attRec.id || a.date === attRec.date ? attRec : a
              );
            }
            return [attRec, ...prev];
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

  const handleDeleteAttendance = async (recordId: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف سجل الحضور هذا؟")) return;
    setAttendance((prev) => prev.filter((a) => a.id !== recordId));
    const res = await deleteAttendanceById(recordId, student.id);
    if (!res.success) {
      alert(res.error || "فشل حذف سجل الحضور");
      router.refresh();
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
          prefetch={false}
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
              {student.avatar_url && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.avatar_url}
                  alt={student.full_name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
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
              onClick={() => {
                lightHaptic();
                setIsLogDialogOpen(true);
              }}
              className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5 text-slate-950" />
              <span>تسجيل تسميع جديد 📖</span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                lightHaptic();
                setIsShareModalOpen(true);
              }}
              className="w-full sm:w-auto bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30 font-bold rounded-2xl gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>تهنئة ومشاركة الإنجاز 🌟</span>
            </Button>

            {parentToken && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCopyParentLink}
                  className={`w-full sm:w-auto font-bold rounded-2xl gap-2 transition-all ${
                    isCopiedToken
                      ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                      : "bg-emerald-900/60 border-emerald-700/70 text-emerald-100 hover:bg-emerald-800/80"
                  }`}
                >
                  {isCopiedToken ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-amber-300" />}
                  <span>{isCopiedToken ? "تم نسخ الرابط!" : "نسخ رابط ولي الأمر 📋"}</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleRegenerateParentToken}
                  disabled={isRegeneratingToken}
                  title="إلغاء الرابط القديم وتوليد رمز وصول جديد لولي الأمر"
                  className="w-full sm:w-auto bg-slate-900/70 hover:bg-rose-950/60 border-slate-700/70 hover:border-rose-600/60 text-slate-200 hover:text-rose-200 font-bold rounded-2xl gap-2 transition-all disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 text-amber-300 ${isRegeneratingToken ? "animate-spin" : ""}`} />
                  <span>{isRegeneratingToken ? "جاري التجديد..." : "تجديد رابط المتابعة 🔄"}</span>
                </Button>

                <Link href={`/parent/${parentToken}`} prefetch={false} target="_blank" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-emerald-900/60 border-emerald-700/70 text-emerald-100 hover:bg-emerald-800/80 font-bold rounded-2xl gap-2"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-300" />
                    <span>معاينة البوابة 🌐</span>
                  </Button>
                </Link>
              </>
            )}
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
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => {
            lightHaptic();
            React.startTransition(() => setActiveTab("logs"));
          }}
          className={`py-3 px-4 sm:px-5 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "logs"
              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>سجل الحفظ والمراجعة ({totalLogsCount})</span>
        </button>

        <button
          onClick={() => {
            lightHaptic();
            React.startTransition(() => setActiveTab("progress"));
          }}
          className={`py-3 px-4 sm:px-5 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "progress"
              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookCheck className="w-4 h-4 text-teal-600" />
          <span>تقدم حفظ السور ({surahProgressList.length})</span>
        </button>

        <button
          onClick={() => {
            lightHaptic();
            React.startTransition(() => setActiveTab("attendance"));
          }}
          className={`py-3 px-4 sm:px-5 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
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
              onClick={() => {
                setEditingLog(null);
                setIsLogDialogOpen(true);
              }}
              size="sm"
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تسميع</span>
            </Button>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <RecitationLogCard
                  key={log.id}
                  log={log}
                  onDelete={handleDeleteLog}
                  onEdit={(logToEdit) => {
                    setEditingLog(logToEdit);
                    setIsLogDialogOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed rounded-3xl">
              <CardContent className="space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-bold text-sm">لا يوجد تسميع مسجل لهذا الطالب بعد</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingLog(null);
                    setIsLogDialogOpen(true);
                  }}
                  className="gap-2 rounded-xl"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>سجل أول تسميع الآن</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Surahs & Juz Memorization Progress Bars */}
      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Row 1: Title & View Switcher */}
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-50">
                {viewMode === "juz" ? "متابعة تقدم حفظ الأجزاء القرآنية 📑" : "متابعة تقدم حفظ السور القرآنية 📊"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {viewMode === "juz"
                  ? "متابعة دقيقة لنسبة إنجاز صفحات الأجزاء الثلاثين"
                  : "متابعة دقيقة لنسبة إنجاز صفحات كل سورة"}
              </p>
            </div>

            {/* View Switcher: ["📖 عرض الأجزاء" | "📜 عرض السور"] */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("juz")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  viewMode === "juz"
                    ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                📖 عرض الأجزاء
              </button>
              <button
                type="button"
                onClick={() => setViewMode("surah")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  viewMode === "surah"
                    ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                📜 عرض السور
              </button>
            </div>
          </div>

          {/* Row 2: Status Filters (Retained & Dynamic) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === "all"
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              الكل ({activeAllCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("in_progress")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === "in_progress"
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              قيد الحفظ ({activeInProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === "completed"
                  ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              مكتملة ({activeCompletedCount})
            </button>
          </div>

          {viewMode === "surah" ? (
            /* Surah Progress Grid */
            filteredSurahList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(showAllProgress ? filteredSurahList : filteredSurahList.slice(0, 5)).map((surah) => (
                    <Card
                      key={surah.surahId}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-black text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                            {surah.surahId}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              سورة {surah.surahName}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              إجمالي صفحات السورة: {surah.totalPages} صفحة
                            </span>
                          </div>
                        </div>

                        {surah.isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            مكتمل 100% ✅
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            قيد الحفظ ({surah.percentage}%) ⏳
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            surah.isCompleted
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-amber-500 to-teal-500"
                          }`}
                          style={{ width: `${surah.percentage}%` }}
                        />
                      </div>

                      {/* Progress Detail Text */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 pt-0.5">
                        <span>
                          {surah.isCompleted
                            ? `تم إتمام حفظ السورة كاملاً (${surah.totalPages} صفحة) ✅`
                            : `تم حفظ ${surah.memorizedPages} من ${surah.totalPages} صفحات`}
                        </span>
                        <span className="font-mono">{surah.percentage}%</span>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredSurahList.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllProgress(!showAllProgress)}
                    className="w-full py-2.5 px-4 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <span>
                      {showAllProgress ? "طي القائمة ⌃" : `عرض كافة السور (${filteredSurahList.length} سورة) ⌄`}
                    </span>
                    {showAllProgress ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </>
            ) : (
              <Card className="p-8 text-center border-dashed rounded-3xl">
                <CardContent className="space-y-3">
                  <BookCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-bold text-sm">لا توجد سور مطابقة للفلتر المحدد</p>
                  <Button variant="outline" onClick={() => setIsLogDialogOpen(true)} className="gap-2 rounded-xl">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>سجل حفظ جديد الآن</span>
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            /* Juz Progress Grid (Collapsible Accordion) */
            filteredJuzList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(showAllProgress ? filteredJuzList : filteredJuzList.slice(0, 5)).map((juz) => {
                    const isExpanded = expandedJuzId === juz.juzNumber;
                    return (
                      <div
                        key={juz.juzNumber}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-sm transition-all"
                      >
                        {/* Compact Single-Row Header */}
                        <button
                          type="button"
                          onClick={() => toggleJuzExpand(juz.juzNumber)}
                          className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          {/* Right: Circle Number + Juz Name */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 font-black text-xs flex items-center justify-center border border-teal-200/80 dark:border-teal-800 shrink-0">
                              {juz.juzNumber}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                {juz.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium sm:hidden">
                                (ص {juz.startPage} - {juz.endPage})
                              </span>
                            </div>
                          </div>

                          {/* Middle: Badge & Left: Interactive Arrow */}
                          <div className="flex items-center gap-2 shrink-0">
                            {juz.isCompleted ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                مكتمل 100% ✅
                              </span>
                            ) : juz.status === "in_progress" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {juz.percentage}% ⏳
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                لم يبدأ
                              </span>
                            )}

                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-teal-600 dark:text-teal-400" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Expandable Details (Opened View) */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                              <span>نطاق الصفحات: (الصفحات {juz.startPage} - {juz.endPage})</span>
                              <span className="font-mono">{juz.percentage}%</span>
                            </div>

                            {/* Full Progress Bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                  juz.isCompleted
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                    : juz.status === "in_progress"
                                    ? "bg-gradient-to-r from-amber-500 to-teal-500"
                                    : "bg-slate-300 dark:bg-slate-600"
                                }`}
                                style={{ width: `${juz.percentage}%` }}
                              />
                            </div>

                            {/* Exact Page Count Text */}
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-0.5">
                              <span>
                                {juz.isCompleted
                                  ? `تم إتمام حفظ الجزء كاملاً (${juz.totalPages} صفحة) ✅`
                                  : juz.status === "in_progress"
                                  ? `تم حفظ ${juz.memorizedPages} من ${juz.totalPages} صفحة ⏳`
                                  : `لم يبدأ بعد (0 من ${juz.totalPages} صفحة)`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filteredJuzList.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllProgress(!showAllProgress)}
                    className="w-full py-2.5 px-4 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <span>
                      {showAllProgress ? "طي القائمة ⌃" : `عرض كافة الأجزاء (${filteredJuzList.length} جزء) ⌄`}
                    </span>
                    {showAllProgress ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </>
            ) : (
              <Card className="p-8 text-center border-dashed rounded-3xl">
                <CardContent className="space-y-3">
                  <BookCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-bold text-sm">لا توجد أجزاء مطابقة للفلتر المحدد</p>
                  <Button variant="outline" onClick={() => setIsLogDialogOpen(true)} className="gap-2 rounded-xl">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>سجل حفظ جديد الآن</span>
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Tab 3: Attendance History List */}
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
                    <CardContent className="p-4 flex items-center justify-between gap-3">
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

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAttendance(att.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-xl transition-colors shrink-0"
                        title="حذف سجل الحضور"
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
        onClose={() => {
          setIsLogDialogOpen(false);
          setEditingLog(null);
        }}
        studentId={student.id}
        studentName={student.full_name}
        existingLogs={logs}
        editingLog={editingLog}
        onSuccess={(savedLog) => {
          const isEdit = Boolean(editingLog);
          setLogs((prev) => {
            const exists = prev.some((l) => l.id === savedLog.id);
            if (exists) {
              return prev.map((l) => (l.id === savedLog.id ? savedLog : l));
            }
            return [savedLog, ...prev];
          });
          setIsLogDialogOpen(false);
          setEditingLog(null);
          showToast(isEdit ? "تم تحديث التسميع بنجاح ✅" : "تم حفظ التسميع بنجاح ✅");
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

      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        student={parentToken ? { ...student, parent_token: parentToken } : student}
        logs={logs}
        attendance={attendance}
      />

      {/* Floating Success Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200 flex items-center gap-2 border border-slate-700/50 dark:border-slate-300/50 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
