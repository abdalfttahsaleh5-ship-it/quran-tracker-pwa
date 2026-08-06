import { Sparkles } from "lucide-react";
import { getTeacherReportDataCached } from "@/lib/actions/student";
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient";
import { SummaryReportTable } from "@/components/dashboard/SummaryReportTable";
import { StatsCards } from "@/components/dashboard/StatsCards";

export const revalidate = 0;

export default async function TeacherDashboardPage() {
  const reportRes = await getTeacherReportDataCached();

  const students = reportRes.success && reportRes.students ? reportRes.students : [];
  const logs = reportRes.success && reportRes.logs ? reportRes.logs : [];
  const attendance = reportRes.success && reportRes.attendance ? reportRes.attendance : [];

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

      {/* Unified Single-Row 3-Column KPI Stats Cards */}
      <StatsCards students={students} logs={logs} />

      {/* Summary Report Table with Daily/Weekly/Monthly Filter and A4 Print Export */}
      <SummaryReportTable students={students} logs={logs} attendance={attendance} />
    </div>
  );
}

