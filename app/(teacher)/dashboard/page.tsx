import { Users, BookCheck, Award, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getTeacherReportDataCached } from "@/lib/actions/student";
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient";
import { SummaryReportTable } from "@/components/dashboard/SummaryReportTable";

export const revalidate = 0;

export default async function TeacherDashboardPage() {
  const reportRes = await getTeacherReportDataCached();

  const students = reportRes.success && reportRes.students ? reportRes.students : [];
  const logs = reportRes.success && reportRes.logs ? reportRes.logs : [];
  const attendance = reportRes.success && reportRes.attendance ? reportRes.attendance : [];

  const totalStudents = students.length;
  const totalPagesSum = logs.reduce((sum, l) => sum + (l.page_count || 1), 0);
  const activeStudentsCount = students.filter((s) => logs.some((l) => l.student_id === s.id)).length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <TeacherDashboardClient />

      {/* Compact Sleek Greeting Banner */}
      <div className="hero-banner no-print print:hidden relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-emerald-800/40">
        {/* Decorative Pattern Background Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/60 border border-emerald-700/60 text-amber-300 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>مساعد معلم القرآن الكريم</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              أهلاً بك، معلم الحلقة 📜
            </h1>
          </div>
          <p className="text-emerald-200/80 text-xs font-medium">
            متابعة دقيقة للحفظ والمراجعة والحضور اليومي
          </p>
        </div>
      </div>

      {/* Unified Single-Row 3-Column KPI Stats */}
      <div className="stats-grid no-print print:hidden grid grid-cols-3 gap-2 sm:gap-4">
        {/* Metric 1: Registered Students */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الطلاب
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {totalStudents}
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              مسجل بالحلقة
            </CardDescription>
          </CardContent>
        </Card>

        {/* Metric 2: Total Recitation Pages */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الصفحات
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
              <BookCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {Number(totalPagesSum.toFixed(1))}
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              صفحة موثقة
            </CardDescription>
          </CardContent>
        </Card>

        {/* Metric 3: Active Students */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              الطلاب الفاعلون
            </CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-baseline gap-1">
              <span>{activeStudentsCount}</span>
              <span className="text-xs text-slate-400 font-bold">/{totalStudents}</span>
            </div>
            <CardDescription className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              لهم تسميعات
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Summary Report Table with Daily/Weekly/Monthly Filter and A4 Print Export */}
      <SummaryReportTable students={students} logs={logs} attendance={attendance} />
    </div>
  );
}
