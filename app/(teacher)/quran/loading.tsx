import { Skeleton } from "@/components/ui/skeleton";

export default function QuranLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Header Controls Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Main Mushaf Page Skeleton */}
      <div className="bg-amber-50/40 dark:bg-slate-900/60 p-6 sm:p-10 rounded-3xl border border-amber-200/50 dark:border-slate-800 space-y-4 text-center min-h-[600px] flex flex-col justify-between shadow-inner">
        <div className="flex justify-between items-center border-b border-amber-200/50 dark:border-slate-800 pb-3">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>

        <div className="space-y-4 my-8 max-w-3xl mx-auto w-full">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-11/12 mx-auto rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-4/5 mx-auto rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-5/6 mx-auto rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>

        <div className="flex justify-between items-center border-t border-amber-200/50 dark:border-slate-800 pt-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
