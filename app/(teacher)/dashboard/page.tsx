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
  const stats = reportRes.success ? reportRes.stats : undefined;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <TeacherDashboardClient />

      {/* Unified Single-Row 3-Column KPI Stats Cards */}
      <StatsCards students={students} logs={logs} attendance={attendance} stats={stats} />

      {/* Summary Report Table with Daily/Weekly/Monthly Filter and A4 Print Export */}
      <SummaryReportTable students={students} logs={logs} attendance={attendance} />
    </div>
  );
}

