"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Award,
  BookCheck,
  Quote,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ParentProgressPayload } from "@/types";
import { GRADE_LABELS, ATTENDANCE_LABELS, LOG_TYPE_LABELS, formatArabicDate, formatPageCount } from "@/lib/utils";
import { AudioPlayer } from "@/components/common/AudioPlayer";
import { SocialLinks } from "@/components/common/SocialLinks";
import { getStudentSurahProgressMap, SurahProgressRecord } from "@/lib/quranMetadata";

interface ParentPortalClientProps {
  student: NonNullable<ParentProgressPayload["student"]>;
  logs: NonNullable<ParentProgressPayload["logs"]>;
  attendance: NonNullable<ParentProgressPayload["attendance"]>;
}

export function ParentPortalClient({ student, logs, attendance }: ParentPortalClientProps) {
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);
  const [surahFilter, setSurahFilter] = useState<"all" | "in_progress" | "completed">("all");

  const safeLogs = Array.isArray(logs) ? logs : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const totalLogsCount = safeLogs.length;
  const totalPagesCount = safeLogs.reduce((acc, log) => acc + (Number(log.page_count) || 0), 0);

  const presentCount = safeAttendance.filter(
    (a) => a?.status === "حاضر" || a?.status === "متأخر"
  ).length;
  const attendanceRate =
    safeAttendance.length > 0
      ? Math.round((presentCount / safeAttendance.length) * 100)
      : 100;

  const surahProgressList = useMemo(() => {
    const map = getStudentSurahProgressMap(safeLogs, student?.id);
    return Array.from(map.values()).sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return new Date(b.lastLogDate || 0).getTime() - new Date(a.lastLogDate || 0).getTime();
    });
  }, [safeLogs, student?.id]);

  const filteredSurahList = useMemo(() => {
    if (surahFilter === "in_progress") {
      return surahProgressList.filter((s) => !s.isCompleted);
    }
    if (surahFilter === "completed") {
      return surahProgressList.filter((s) => s.isCompleted);
    }
    return surahProgressList;
  }, [surahProgressList, surahFilter]);

  const toggleLogExpansion = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const displayedAttendance = isAttendanceExpanded ? safeAttendance : safeAttendance.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Sleek Profile Hero Header */}
        <Card className="border-emerald-800/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-2xl overflow-hidden relative rounded-3xl">
          {/* Background Decorative Radial Glows */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <CardContent className="p-6 sm:p-8 space-y-6 relative z-10">
            {/* Centered/Balanced Hero Layout */}
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-right">
              {/* Significantly Enlarged Student Profile Photo */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl shrink-0 overflow-hidden border-2 border-white/20">
                {student?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{student?.full_name ? student.full_name.charAt(0) : "📖"}</span>
                )}
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-700/60 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>بوابة ولي الأمر</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  {student?.full_name || "الطالب"}
                </h1>

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-xs text-emerald-200 font-medium">
                  {student?.academic_grade && (
                    <span className="bg-white/15 px-3 py-1 rounded-xl font-bold border border-white/10">
                      🎓 {student.academic_grade}
                    </span>
                  )}
                  {student?.school_name && (
                    <span className="bg-white/15 px-3 py-1 rounded-xl font-medium border border-white/10">
                      🏫 {student.school_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quranic Hadith Motivation Quote */}
            <div className="pt-4 border-t border-emerald-800/60 flex items-start gap-3 bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
              <Quote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-emerald-100 italic leading-relaxed">
                قال رسول الله ﷺ: <strong className="text-amber-300 font-bold">«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»</strong> - هنيئاً لكم هذا الغرس الطيب والمتابعة المباركة لكتاب الله.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unified Compact KPI Stats Grid (Single 3-Column Row) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                إجمالي الجلسات
              </CardTitle>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                {totalLogsCount}
              </div>
              <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                جلسة تسميع
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
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
                {attendanceRate}%
              </div>
              <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                انضباط بالحلقة
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                إجمالي الصفحات
              </CardTitle>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                <BookCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                {formatPageCount(totalPagesCount)}
              </div>
              <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                صفحة منجزة
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quranic Surahs Memorization Progress Card */}
        {surahProgressList.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-black text-slate-900 dark:text-slate-50">
                    <BookCheck className="w-5 h-5 text-emerald-600" />
                    <span>تقدم حفظ السور القرآنية 📊</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    متابعة دقيقة لمقدار الحفظ المنجز من صفحات كل سورة
                  </CardDescription>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setSurahFilter("all")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      surahFilter === "all"
                        ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    الكل ({surahProgressList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurahFilter("in_progress")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      surahFilter === "in_progress"
                        ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    قيد الحفظ ({surahProgressList.filter((s) => !s.isCompleted).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurahFilter("completed")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      surahFilter === "completed"
                        ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    مكتملة ({surahProgressList.filter((s) => s.isCompleted).length})
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSurahList.map((surah) => (
                  <div
                    key={surah.surahId}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                          {surah.surahId}
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          سورة {surah.surahName}
                        </h4>
                      </div>

                      {surah.isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          مكتمل 100% ✅
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          قيد الحفظ ({surah.percentage}%)
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

                    {/* Progress Detail Text: "تم حفظ 1 من 3 صفحات" */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>
                        {surah.isCompleted
                          ? `تم إتمام حفظ السورة كاملاً (${surah.totalPages} صفحة)`
                          : `تم حفظ ${surah.memorizedPages} من ${surah.totalPages} صفحات`}
                      </span>
                      <span>{surah.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Collapsible Recitation Logs Timeline */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-black text-slate-900 dark:text-slate-50">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span>سجل التسميع والمراجعة اليومي ({totalLogsCount})</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              انقر على أي جلسة لعرض التفاصيل الكاملة والتقييم
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-2.5">
            {safeLogs.length > 0 ? (
              safeLogs.map((log) => {
                const isExpanded = expandedLogIds.has(log.id);
                const gradeInfo = (log?.grade && GRADE_LABELS[log.grade]) || { label: log?.grade || "غير محدد", color: "" };
                const typeInfo = (log?.log_type && LOG_TYPE_LABELS[log.log_type]) || { label: log?.log_type || "تسميع", color: "" };

                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-xs"
                  >
                    {/* Collapsed Row Header */}
                    <button
                      type="button"
                      onClick={() => toggleLogExpansion(log.id)}
                      className="w-full p-3.5 flex items-center justify-between gap-3 text-right hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                          {log?.created_at ? formatArabicDate(log.created_at) : ""}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {log.surah_start === log.surah_end
                            ? `سورة ${log.surah_start}`
                            : `سورة ${log.surah_start} ➔ ${log.surah_end}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80">
                          📖 {formatPageCount(log?.page_count)}
                        </span>
                        {log?.audio_url && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                            <span>🎙️ تلاوة مسجلة</span>
                          </span>
                        )}
                      </div>

                      <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Expanded Details Body */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold border ${gradeInfo.color}`}>
                            {gradeInfo.label}
                          </span>
                          {log?.assistant_name && (
                            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              👤 المسمّع: {log.assistant_name}
                            </span>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          من سورة <span className="text-teal-700 dark:text-teal-400">{log?.surah_start || "-"}</span> (آية {log?.aya_start || 1}) إلى سورة{" "}
                          <span className="text-teal-700 dark:text-teal-400">{log?.surah_end || "-"}</span> (آية {log?.aya_end || 1})
                        </div>

                        {log?.audio_url && (
                          <div className="pt-1.5 space-y-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80">
                            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                              <span>🎙️ استمع لتلاوة ابنكم المسجلة:</span>
                            </span>
                            <audio
                              controls
                              className="w-full h-9 rounded-xl shadow-xs"
                              src={log.audio_url}
                              preload="none"
                            />
                          </div>
                        )}

                        {log?.notes && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                            <strong>ملاحظة المعلم:</strong> {log.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-semibold text-sm">
                  لا توجد سجلات تسميع مضافة حتى الآن
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Collapsible Attendance History Log */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between font-black text-slate-900 dark:text-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>سجل الحضور والغياب ({safeAttendance.length})</span>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-3">
            {safeAttendance.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {displayedAttendance.map((att) => {
                    const statusInfo = (att?.status && ATTENDANCE_LABELS[att.status]) || { label: att?.status || "غير محدد", color: "" };

                    return (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          {att?.date ? formatArabicDate(att.date) : "-"}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {safeAttendance.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setIsAttendanceExpanded(!isAttendanceExpanded)}
                    className="w-full py-2.5 px-4 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 rounded-2xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>{isAttendanceExpanded ? "طي سجل الحضور" : `عرض كافة السجلات (${safeAttendance.length} يوم)`}</span>
                    {isAttendanceExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-10 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-semibold text-sm">
                  لا توجد سجلات حضور مضافة حتى الآن
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Contact & Social Links Note */}
        <div className="text-center text-xs text-slate-500 space-y-3 py-6 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              تابع أنشطة وإعلانات مسجد حذيفة بن اليمان:
            </span>
            <SocialLinks iconSize="md" />
          </div>

          <p className="flex items-center justify-center gap-1 text-slate-500 pt-1">
            <HeartHandshake className="w-4 h-4 text-teal-600" />
            <span>نعتز بتواصلكم ومتابعتكم المستمرة مع معلم الحلقة</span>
          </p>
          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} متابع الحفظ • مسجد حذيفة بن اليمان - طبربور
          </p>
        </div>
      </div>
    </div>
  );
}
