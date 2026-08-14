"use client";

import React from "react";
import { Trash2, Volume2, Mic } from "lucide-react";
import { MemorizationLogRow } from "@/types";
import { GRADE_LABELS, LOG_TYPE_LABELS, formatArabicDate, formatPageCount } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface RecitationLogCardProps {
  log: MemorizationLogRow | (Record<string, any> & { id: string });
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
  className?: string;
}

export function RecitationLogCard({
  log,
  onDelete,
  showDeleteButton = true,
  className = "",
}: RecitationLogCardProps) {
  const gradeInfo = (log?.grade && GRADE_LABELS[log.grade as keyof typeof GRADE_LABELS]) || {
    label: log?.grade || "غير محدد",
    color: "",
  };
  const typeInfo = (log?.log_type && LOG_TYPE_LABELS[log.log_type as keyof typeof LOG_TYPE_LABELS]) || {
    label: log?.log_type || "تسميع",
    color: "",
  };

  const audioUrl = log.audio_url || log.audioUrl || null;

  return (
    <Card className={`hover:shadow-md transition-all border-slate-200 dark:border-slate-800 rounded-2xl ${className}`}>
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1 w-full min-w-0">
          {/* Metadata Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${gradeInfo.color}`}>
              {gradeInfo.label}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
              📖 {formatPageCount(log.page_count ?? log.pageCount)}
            </span>
            {log.assistant_name && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                👤 المسمّع: {log.assistant_name}
              </span>
            )}
            {audioUrl && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                <Mic className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>🎙️ تلاوة مسجلة</span>
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-bold">
              {log.created_at ? formatArabicDate(log.created_at) : ""}
            </span>
          </div>

          {/* Surah Range */}
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
            من سورة <span className="text-emerald-700 dark:text-emerald-400">{log.surah_start}</span> (آية {log.aya_start || 1}) إلى سورة{" "}
            <span className="text-emerald-700 dark:text-emerald-400">{log.surah_end || log.surah_start}</span> (آية {log.aya_end || 1})
          </div>

          {/* Inline Audio Player */}
          {audioUrl && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 w-full max-w-lg">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Volume2 className="w-3.5 h-3.5" />
                <span>🎙️ تلاوة الطالب المسجلة</span>
              </div>
              <audio controls src={audioUrl} className="w-full h-8" preload="metadata" />
            </div>
          )}

          {/* Teacher Notes */}
          {log.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 mt-1">
              ملاحظة المعلم: {log.notes}
            </p>
          )}
        </div>

        {/* Delete Action Button */}
        {showDeleteButton && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(log.id)}
            className="text-slate-400 hover:text-rose-600 shrink-0 rounded-xl"
            title="حذف التسميع"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
