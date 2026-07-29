import Link from "next/link";
import { Users, UserPlus, BookCheck, CalendarCheck, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudents } from "@/lib/actions/student";
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient";

export const revalidate = 0;

export default async function TeacherDashboardPage() {
  const res = await getStudents();
  const students = res.success && res.data ? res.data : [];
  const totalStudents = students.length;

  return (
    <div className="space-y-8">
      <TeacherDashboardClient />
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-800 to-teal-600 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black">أهلاً بك، معلم الحلقة 📜</h2>
          <p className="text-teal-100 text-sm mt-1">
            تابع إنجاز طلابك واحتسب الأجر في تعليم كتاب الله تعالى
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/students">
            <Button variant="secondary" className="gap-2 font-bold shadow-md">
              <UserPlus className="w-4 h-4" />
              <span>إدارة قائمة الطلاب</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-teal-300 transition-all border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              إجمالي الطلاب المسجلين
            </CardTitle>
            <Users className="w-5 h-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
              {totalStudents}
            </div>
            <CardDescription className="text-xs mt-1">طلاب نشطون في الحلقة</CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-300 transition-all border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              سجلات الحفظ اليومية
            </CardTitle>
            <BookCheck className="w-5 h-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">--</div>
            <CardDescription className="text-xs mt-1">تسميع تم تدوينه هذا الأسبوع</CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-300 transition-all border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              نسبة الحضور اليومي
            </CardTitle>
            <CalendarCheck className="w-5 h-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">-- %</div>
            <CardDescription className="text-xs mt-1">حضور طلاب اليوم</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Grid */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
          <CardDescription>إدارة طلاب الحلقة وتوليد روابط أسر الطلاب</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/students">
            <Button variant="default" className="gap-2">
              <Users className="w-4 h-4" />
              <span>انتقل إلى قائمة الطلاب ({totalStudents})</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
