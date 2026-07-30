import Link from "next/link";
import { Users, UserPlus, BookOpen, Award, ArrowLeft, Sparkles, CheckCircle2, BookCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeacherReportData } from "@/lib/actions/student";
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient";
import { SummaryReportTable } from "@/components/dashboard/SummaryReportTable";

export const revalidate = 0;

export default async function TeacherDashboardPage() {
  const reportRes = await getTeacherReportData();

  const students = reportRes.success && reportRes.students ? reportRes.students : [];
  const logs = reportRes.success && reportRes.logs ? reportRes.logs : [];
  const attendance = reportRes.success && reportRes.attendance ? reportRes.attendance : [];

  const totalStudents = students.length;
  const totalPagesSum = logs.reduce((sum, l) => sum + (l.page_count || 1), 0);
  const activeStudentsCount = students.filter((s) => logs.some((l) => l.student_id === s.id)).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <TeacherDashboardClient />

      {/* Hero Banner with Deep Emerald Gradient & Gold Accents */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/20 border border-emerald-800/40">
        {/* Decorative Pattern Background Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
        
        {/* Radial Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-700/60 text-amber-300 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مساعد معلم القرآن الرقمي</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
              أهلاً بك، معلم الحلقة 📜
            </h1>
            <p className="text-emerald-200/90 text-sm leading-relaxed font-medium">
              تابع إنجاز طلابك في الحفظ والمراجعة واحتسب الأجر في تعليم كتاب الله تعالى.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Link href="/students" prefetch={true} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus className="w-5 h-5 text-slate-950" />
                <span>إدارة قائمة الطلاب</span>
              </Button>
            </Link>

            <Link href="/quran" prefetch={true} className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-emerald-900/60 border-emerald-700/70 text-emerald-100 hover:bg-emerald-800/80 font-bold rounded-2xl gap-2"
              >
                <BookOpen className="w-5 h-5 text-amber-300" />
                <span>فتح المصحف</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Quick Stat Cards in 2-Column Responsive Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-6">
        {/* Card 1: Registered Students */}
        <Card className="rounded-2xl border border-emerald-100/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 sm:p-6 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              إجمالي الطلاب
            </CardTitle>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {totalStudents}
            </div>
            <CardDescription className="text-[11px] sm:text-xs mt-1 text-slate-500 font-medium">
              طالب مسجّل في الحلقة
            </CardDescription>
          </CardContent>
        </Card>

        {/* Card 2: Total Pages Recited */}
        <Card className="rounded-2xl border border-emerald-100/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 sm:p-6 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              إجمالي الصفحات
            </CardTitle>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
              <BookCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {Number(totalPagesSum.toFixed(1))}
            </div>
            <CardDescription className="text-[11px] sm:text-xs mt-1 text-slate-500 font-medium">
              صفحة موثقة للطلاب
            </CardDescription>
          </CardContent>
        </Card>

        {/* Card 3: Active Students with Progress */}
        <Card className="col-span-2 md:col-span-1 rounded-2xl border border-emerald-100/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 sm:p-6 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              الطلاب الفاعلون
            </CardTitle>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-baseline gap-1">
              <span>{activeStudentsCount}</span>
              <span className="text-sm font-bold text-slate-400">/ {totalStudents}</span>
            </div>
            <CardDescription className="text-[11px] sm:text-xs mt-1 text-slate-500 font-medium">
              لهم تسميعات مسجلة
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Summary Report Table with Daily/Weekly/Monthly Filter and A4 Print Export */}
      <SummaryReportTable students={students} logs={logs} attendance={attendance} />

      {/* Quick Action Navigation Grid */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              الإجراءات والروابط السريعة
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
            وصول مباشر لإدارة الطلاب والروابط الخاصة بأولياء الأمور
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-3">
          <Link href="/students" prefetch={true} className="flex-1">
            <Button size="lg" className="w-full justify-between gap-2 font-bold rounded-2xl">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-300" />
                <span>عرض كشوفات جميع الطلاب ({totalStudents})</span>
              </div>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/quran" prefetch={true} className="flex-1">
            <Button size="lg" variant="outline" className="w-full justify-between gap-2 font-bold rounded-2xl border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <span>المصحف الشريف 📖</span>
              </div>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
