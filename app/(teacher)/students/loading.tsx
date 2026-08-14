import { StudentCardSkeleton } from "@/components/teacher/StudentCardSkeleton";

export default function StudentsLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2 animate-pulse">
          <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-64 bg-slate-100 dark:bg-slate-850 rounded-lg" />
        </div>
      </div>
      <StudentCardSkeleton count={6} />
    </div>
  );
}
