import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

interface StudentCardSkeletonProps {
  count?: number;
}

export function StudentCardSkeleton({ count = 6 }: StudentCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse rounded-2xl overflow-hidden"
        >
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3 w-full">
              {/* Avatar placeholder */}
              <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-850 rounded" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-2">
            {/* Total pages badge placeholder */}
            <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
            {/* Phone placeholder */}
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-850 rounded" />
          </CardContent>

          <CardFooter className="p-4 pt-0 flex flex-col gap-2">
            <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-9 w-full bg-slate-100 dark:bg-slate-850 rounded-xl" />
            <div className="flex items-center justify-between w-full pt-1">
              <div className="h-7 w-24 bg-slate-100 dark:bg-slate-850 rounded-lg" />
              <div className="flex gap-1">
                <div className="h-8 w-8 bg-slate-100 dark:bg-slate-850 rounded-lg" />
                <div className="h-8 w-8 bg-slate-100 dark:bg-slate-850 rounded-lg" />
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
