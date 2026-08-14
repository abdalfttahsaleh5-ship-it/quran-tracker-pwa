"use client";

import { useState } from "react";
import { User, Phone, Copy, Check, Edit3, Trash2, ExternalLink, BookOpen, MessageSquare, AlertTriangle } from "lucide-react";
import { StudentRow } from "@/types";
import { AttendanceAlert } from "@/lib/attendanceAlerts";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface StudentCardProps {
  student: StudentRow;
  logs?: any[];
  alert?: AttendanceAlert;
  onEdit: (student: StudentRow) => void;
  onDelete: (student: StudentRow) => void;
}

export function StudentCard({ student, logs, alert, onEdit, onDelete }: StudentCardProps) {
  const [copied, setCopied] = useState(false);

  // Dynamic completed pages calculation from logs
  const studentLogs = logs?.filter(
    (log) => String(log.student_id || log.studentId) === String(student.id)
  ) || [];

  const totalCompletedPages = studentLogs.length > 0
    ? studentLogs.reduce((sum, log) => {
        const pages = Number(log.page_count ?? log.pageCount ?? log.pages ?? 1);
        return sum + (isNaN(pages) ? 0 : pages);
      }, 0)
    : Number(student.total_pages_count || 0);

  const formattedPages = totalCompletedPages.toFixed(1).replace(/\.0$/, "");

  const handleCopyParentLink = async () => {
    const parentUrl = `${window.location.origin}/parent/${student.parent_token}`;
    try {
      await navigator.clipboard.writeText(parentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = parentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold overflow-hidden border border-teal-200 shrink-0">
            {student.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base">{student.full_name.charAt(0)}</span>
            )}
          </div>
          <div>
            <Link href={`/students/${student.id}`} prefetch={true} className="hover:underline">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 flex-wrap">
                <span>{student.full_name}</span>
                {student.academic_grade && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200">
                    {student.academic_grade}
                  </span>
                )}
                {alert && (
                  <span
                    title={alert.reason}
                    className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shrink-0"
                  >
                    ⚠️ {alert.reason}
                  </span>
                )}
              </CardTitle>
            </Link>
            <p className="text-xs text-slate-400 mt-0.5">
              تم التسجيل: {new Date(student.created_at).toLocaleDateString("ar-JO")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 text-sm space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 p-2 rounded-lg border border-teal-100 dark:border-teal-900">
          <span>📚 مجموع التسميع المنجز:</span>
          <span className="font-mono text-sm font-black">{formattedPages} صفحة</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 pt-1">
          <Phone className="w-4 h-4 text-teal-600 shrink-0" />
          <span>هاتف ولي الأمر: </span>
          <span dir="ltr" className="font-mono text-slate-800 dark:text-slate-200">
            {student.parent_phone || "غير مسجل"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {/* Main Action: Open Student Detail Profile */}
        <Link href={`/students/${student.id}`} prefetch={true} className="w-full">
          <Button variant="default" size="sm" className="w-full gap-2 font-bold shadow-sm">
            <BookOpen className="w-4 h-4" />
            <span>عرض الملف والتسميع اليومي</span>
          </Button>
        </Link>

        {/* Copy Parent Link Button */}
        <Button
          variant={copied ? "default" : "outline"}
          size="sm"
          onClick={handleCopyParentLink}
          className={`w-full gap-2 transition-all ${
            copied ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>تم نسخ رابط ولي الأمر!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-teal-600" />
              <span>نسخ رابط متابعة ولي الأمر</span>
            </>
          )}
        </Button>

        {/* Action Row */}
        <div className="flex items-center justify-between w-full pt-1">
          <Link href={`/parent/${student.parent_token}`} prefetch={true} target="_blank">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-teal-700 hover:text-teal-800">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>معاينة البوابة</span>
            </Button>
          </Link>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(student)}
              title="تعديل البيانات"
              className="h-8 w-8 text-slate-600 hover:text-teal-700"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(student)}
              title="حذف الطالب"
              className="h-8 w-8 text-slate-600 hover:text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
