"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { StudentRow, AttendanceRecordRow } from "@/types";
import { getAttendanceAlerts, AttendanceAlert } from "@/lib/attendanceAlerts";
import { AlertTriangle, MessageSquare, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceAlertsCardProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRow[];
  attendance: AttendanceRecordRow[];
}

export function AttendanceAlertsCard({
  isOpen,
  onClose,
  students,
  attendance,
}: AttendanceAlertsCardProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const alerts: AttendanceAlert[] = useMemo(() => {
    return getAttendanceAlerts(students, attendance);
  }, [students, attendance]);

  if (!isOpen) return null;

  const alertCount = alerts.length;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header Section */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-black text-lg sm:text-xl">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span>طلاب بحاجة إلى متابعة 🔔</span>
            {alertCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm mr-2">
                {alertCount} {alertCount === 1 ? "طالب" : alertCount === 2 ? "طالبان" : "طلاب"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {alertCount === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                لا يوجد طلاب يواجهون مشاكل غياب حالياً ✨
              </p>
              <p className="text-xs text-slate-500">
                جميع الطلاب ملتزمون بجدول الحضور والمتابعة بشكل منتظم.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.studentId}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-amber-200/80 dark:border-amber-900/50 shadow-sm flex flex-col justify-between gap-3 hover:border-amber-400 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 flex items-center justify-center font-black text-sm shrink-0">
                        {alert.studentName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/students/${alert.studentId}`}
                          onClick={onClose}
                          className="font-black text-sm text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {alert.studentName}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {alert.academicGrade || "غير محدد"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border shrink-0 ${
                        alert.alertType === "consecutive"
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-900"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-900"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{alert.reason}</span>
                    </span>
                  </div>

                  {alert.formattedWhatsAppUrl ? (
                    <a
                      href={alert.formattedWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        type="button"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        <MessageSquare className="w-4 h-4 fill-current" />
                        <span>تواصل مع ولي الأمر 💬</span>
                      </Button>
                    </a>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>رقم ولي الأمر غير مسجل</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
