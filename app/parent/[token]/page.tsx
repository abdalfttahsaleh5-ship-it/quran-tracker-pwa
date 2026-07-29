import { Metadata } from "next";
import { getStudentProgressByToken } from "@/lib/actions/student";
import { BookOpen, Calendar, Award, ShieldCheck, HeartHandshake, AlertCircle, Quote } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParentProgressPayload } from "@/types";
import { GRADE_LABELS, ATTENDANCE_LABELS, LOG_TYPE_LABELS, formatArabicDate, formatPageCount } from "@/lib/utils";

export const revalidate = 0;

interface ParentPortalPageProps {
  params: {
    token: string;
  };
}

export async function generateMetadata({ params }: ParentPortalPageProps): Promise<Metadata> {
  try {
    const token = params?.token;
    if (!token) {
      return {
        title: "بوابة متابعة أولياء الأمور - متابع الحفظ",
      };
    }

    const payload = await getStudentProgressByToken(token);

    if (payload && payload.success && payload.student) {
      const studentName = payload.student.full_name || "الطالب";
      return {
        title: `متابعة حفظ القرآن الكريم - ${studentName}`,
        description: `سجل الحفظ والمراجعة والحضور اليومي للطالب ${studentName} في الحلقة القرآنية`,
        openGraph: {
          title: `متابعة حفظ القرآن الكريم - ${studentName}`,
          description: `تقرير متابعة حقيقي لمستوى وإنجاز الطالب ${studentName} في حفظ وتسميع القرآن الكريم`,
          type: "website",
          locale: "ar_SA",
          siteName: "متابع الحفظ",
        },
        twitter: {
          card: "summary",
          title: `متابعة حفظ القرآن الكريم - ${studentName}`,
          description: `تقرير متابعة حقيقي لمستوى وإنجاز الطالب ${studentName} في حفظ وتسميع القرآن الكريم`,
        },
      };
    }
  } catch {
    // Fallback metadata on error
  }

  return {
    title: "بوابة متابعة أولياء الأمور - متابع الحفظ",
    description: "تقرير متابعة حفظ ومراجعة القرآن الكريم والحضور اليومي",
  };
}

export default async function ParentPortalPage({ params }: ParentPortalPageProps) {
  const token = params?.token;

  if (!token) {
    return renderErrorCard("الرابط غير صحيح أو مفقود");
  }

  const payload: ParentProgressPayload = await getStudentProgressByToken(token);

  if (!payload || !payload.success || !payload.student) {
    return renderErrorCard(payload?.error || "الرابط غير صالح أو تم حذف بيانات الطالب");
  }

  const { student, logs = [], attendance = [] } = payload;
  const safeLogs = Array.isArray(logs) ? logs : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const totalLogsCount = safeLogs.length;
  const presentCount = safeAttendance.filter(
    (a) => a?.status === "حاضر" || a?.status === "متأخر"
  ).length;
  const attendanceRate =
    safeAttendance.length > 0
      ? Math.round((presentCount / safeAttendance.length) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Motivational Header Banner */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-950 via-teal-800 to-teal-900 text-white shadow-2xl overflow-hidden relative">
          <CardHeader className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-teal-200" />
                </div>
                <span className="text-sm font-medium text-teal-200">بوابة متابعة أولياء الأمور</span>
              </div>
              <Badge variant="outline" className="border-teal-400/40 text-teal-200 gap-1 bg-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>رابط مشفّر وخاص</span>
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center font-bold text-2xl shadow-inner shrink-0 overflow-hidden border-2 border-white/20">
                {student?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{student?.full_name ? student.full_name.charAt(0) : "📖"}</span>
                )}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  تقرير إنجاز الطالب: {student?.full_name || "الطالب"}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-teal-200 pt-1">
                  {student?.academic_grade && (
                    <span className="bg-white/15 px-2.5 py-0.5 rounded-md text-teal-100 font-bold border border-white/10">
                      🎓 {student.academic_grade}
                    </span>
                  )}
                  {student?.school_name && (
                    <span className="bg-white/15 px-2.5 py-0.5 rounded-md text-teal-100 font-medium border border-white/10">
                      🏫 {student.school_name}
                    </span>
                  )}
                  {student?.address && (
                    <span className="bg-white/15 px-2.5 py-0.5 rounded-md text-teal-100 font-medium border border-white/10">
                      🏠 {student.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quranic Hadith Motivation Quote */}
            <div className="mt-4 pt-4 border-t border-teal-700/60 flex items-start gap-3 bg-white/5 p-4 rounded-xl backdrop-blur-sm">
              <Quote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-teal-100 italic leading-relaxed">
                قال رسول الله ﷺ: <strong className="text-amber-300 font-bold">«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»</strong> - هنيئاً لكم هذا الغرس الطيب والمتابعة المباركة لكتاب الله.
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:border-teal-300 transition-all border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 font-semibold">إجمالي جلسات التسميع والتحفيظ</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-3xl font-black text-teal-700 dark:text-teal-400">{totalLogsCount}</span>
              <Award className="w-7 h-7 text-amber-500" />
            </CardContent>
          </Card>

          <Card className="hover:border-teal-300 transition-all border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 font-semibold">نسبة الحضور والانضباط</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-3xl font-black text-teal-700 dark:text-teal-400">{attendanceRate}%</span>
              <Calendar className="w-7 h-7 text-teal-600" />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Memorization Logs Timeline */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span>سجل التسميع والمراجعة اليومي ({totalLogsCount})</span>
            </CardTitle>
            <CardDescription>
              عرض السجلات المعتمدة فور رصدها من معلم الحلقة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {safeLogs.length > 0 ? (
              <div className="space-y-3">
                {safeLogs.map((log) => {
                  const gradeInfo = (log?.grade && GRADE_LABELS[log.grade]) || { label: log?.grade || "غير محدد", color: "" };
                  const typeInfo = (log?.log_type && LOG_TYPE_LABELS[log.log_type]) || { label: log?.log_type || "تسميع", color: "" };

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2 hover:border-teal-200 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${gradeInfo.color}`}>
                          {gradeInfo.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                          📖 {formatPageCount(log?.page_count)}
                        </span>
                        {log?.assistant_name && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            👤 المسمّع: {log.assistant_name}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 mr-auto">
                          {log?.created_at ? formatArabicDate(log.created_at) : ""}
                        </span>
                      </div>

                      <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        من سورة <span className="text-teal-700 dark:text-teal-400">{log?.surah_start || "-"}</span> (آية {log?.aya_start || 1}) إلى سورة{" "}
                        <span className="text-teal-700 dark:text-teal-400">{log?.surah_end || "-"}</span> (آية {log?.aya_end || 1})
                      </div>

                      {log?.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          ملاحظة المعلم: {log.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-semibold text-sm">
                  لا توجد سجلات تسميع مضافة لهذا الطالب حتى الآن
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span>سجل الحضور والغياب ({safeAttendance.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safeAttendance.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {safeAttendance.map((att) => {
                  const statusInfo = (att?.status && ATTENDANCE_LABELS[att.status]) || { label: att?.status || "غير محدد", color: "" };

                  return (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs"
                    >
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {att?.date ? formatArabicDate(att.date) : "-"}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
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

        {/* Footer Contact Note */}
        <div className="text-center text-xs text-slate-500 space-y-1 py-4">
          <p className="flex items-center justify-center gap-1">
            <HeartHandshake className="w-4 h-4 text-teal-600" />
            <span>نعتز بتواصلكم ومتابعتكم المستمرة مع معلم الحلقة</span>
          </p>
          <p>© {new Date().getFullYear()} متابع الحفظ - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}

function renderErrorCard(message: string) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 border-rose-200 dark:border-rose-900 shadow-xl">
        <CardContent className="space-y-4 pt-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            الرابط غير صالح أو غير موجود
          </CardTitle>
          <CardDescription className="text-slate-500">
            {message || "يرجى التأكد من الحصول على رابط المتابعة الصحيح الخاص بابنكم من معلم الحلقة"}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
