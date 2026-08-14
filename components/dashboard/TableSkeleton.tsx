import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-3 w-64 bg-slate-100 dark:bg-slate-850 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Controls skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="h-9 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-full sm:w-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="h-10 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4">
            <div className="h-3 w-8 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="h-12 flex items-center px-4 gap-4">
                <div className="h-3 w-6 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded" />
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                <div className="h-6 w-24 bg-slate-100 dark:bg-slate-850 rounded-full mx-auto" />
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-850 rounded" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
