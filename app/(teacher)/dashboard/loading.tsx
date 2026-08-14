import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Top summary stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
          >
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-850 rounded" />
          </div>
        ))}
      </div>

      {/* Main summary table skeleton */}
      <TableSkeleton rows={6} />
    </div>
  );
}
