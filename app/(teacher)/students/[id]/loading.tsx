import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDetailLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back Button Skeleton */}
      <Skeleton className="h-5 w-36 rounded-lg" />

      {/* Header Profile Card Skeleton */}
      <Skeleton className="h-36 w-full rounded-2xl" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 border-b pb-2 border-slate-200 dark:border-slate-800">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Logs List Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
