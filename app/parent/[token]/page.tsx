import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Calendar, Award, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParentProgressPayload } from "@/types";
import { GRADE_LABELS, ATTENDANCE_LABELS, LOG_TYPE_LABELS, formatArabicDate } from "@/lib/utils";

export const revalidate = 0;

interface ParentPortalPageProps {
  params: {
    token: string;
  };
}

export default async function ParentPortalPage({ params }: ParentPortalPageProps) {
  const { token } = params;
  const supabase = createClient();

  // Call the SECURITY DEFINER RPC function get_student_progress_by_token
  const rpcFn = supabase.rpc as unknown as (
    fnName: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpcFn("get_student_progress_by_token", {
    p_token: token,
  });

  const payload = data as unknown as ParentProgressPayload | null;

  if (error || !payload || !payload.success || !payload.student) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-rose-200">
          <CardContent className="space-y-4 pt-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              الرابط غير صحيح أو غير موجود
            </CardTitle>
            <CardDescription className="text-slate-500">
              يرجى التأكد من الحصول على رابط المتابعة الصحيح من معلم الحلقة
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, logs = [], attendance = [] } = payload;

  const totalLogsCount = logs.length;
  const presentCount = attendance.filter((a) => a.status === "حاضر" || a.status === "متأخر").length;
  const attendanceRate =
    attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 text-white shadow-xl overflow-hidden">
          <CardHeader className="space-y-3 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-teal-200" />
                </div>
                <span className="text-sm font-medium text-teal-200">بوابة متابعة أولياء الأمور</span>
              </div>
              <Badge variant="outline" className="border-teal-400/30 text-teal-200 gap-1 bg-white/5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>رابط مشفّر وخاص</span>
              </Badge>
            </div>

            <div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-white">
                تقرير إنجاز الطالب: {student.full_name}
              </CardTitle>
              <CardDescription className="text-teal-200 mt-1">
                سجل حي وحقيقي ومُحدث مباشرة لعمليات التسميع والمراجعة والحضور اليومي
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 font-normal">إجمالي جلسات التسميع</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-3xl font-black text-teal-700">{totalLogsCount}</span>
              <Award className="w-6 h-6 text-amber-500" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 font-normal">نسبة الحضور والانضباط</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-3xl font-black text-teal-700">{attendanceRate}%</span>
              <Calendar className="w-6 h-6 text-teal-600" />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Memorization Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span>سجل التسميع والمراجعة اليومي ({totalLogsCount})</span>
            </CardTitle>
            <CardDescription>
              يتم رخص وتحديث البيانات فور اعتماد معلم الحلقة للتسميع
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => {
                  const gradeInfo = GRADE_LABELS[log.grade] || { label: log.grade, color: "" };
                  const typeInfo = LOG_TYPE_LABELS[log.log_type] || { label: log.log_type, color: "" };

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2"
                    >
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

                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        من سورة <span className="text-teal-700">{log.surah_start}</span> (آية {log.aya_start}) إلى سورة{" "}
                        <span className="text-teal-700">{log.surah_end}</span> (آية {log.aya_end})
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-500 bg-white dark:bg-slate-800 p-2 rounded-lg">
                          ملاحظة المعلم: {log.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-500 text-sm">
                لا توجد سجلات تسميع مضافة لهذا الطالب بعد
              </p>
            )}
          </CardContent>
        </Card>

        {/* Detailed Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span>سجل الحضور والغياب ({attendance.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attendance.map((att) => {
                  const statusInfo = ATTENDANCE_LABELS[att.status] || { label: att.status, color: "" };

                  return (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatArabicDate(att.date)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-500 text-sm">
                لا توجد سجلات حضور مضافة بعد
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
