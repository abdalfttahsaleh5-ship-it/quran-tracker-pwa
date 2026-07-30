import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="space-y-2 text-center flex flex-col items-center">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
