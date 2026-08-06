"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StudentRow, AttendanceRecordRow } from "@/types";
import { getAttendanceAlerts, AttendanceAlert } from "@/lib/attendanceAlerts";
import { AlertTriangle, MessageSquare, ChevronDown, ChevronUp, User, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AttendanceAlertsCardProps {
  students: StudentRow[];
  attendance: AttendanceRecordRow[];
}

export function AttendanceAlertsCard({ students, attendance }: AttendanceAlertsCardProps) {
  // Collapsed by default upon entering dashboard
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Compute active alerts
  const alerts: AttendanceAlert[] = useMemo(() => {
    return getAttendanceAlerts(students, attendance);
  }, [students, attendance]);

  const alertCount = alerts.length;

  return (
    <Card className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-sm overflow-hidden transition-all print:hidden">
      {/* Header Section (Clickable Accordion Trigger) */}
      <CardHeader
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 sm:p-5 flex flex-row items-center justify-between gap-3 border-b border-amber-100 dark:border-amber-900/40 cursor-pointer select-none hover:bg-amber-100/30 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>طلاب يحتاجون متابعة عاجلة 🔔</span>
              {alertCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm">
                  {alertCount} {alertCount === 1 ? "طالب" : alertCount === 2 ? "طالبان" : "طلاب"}
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              تنبيهات الغياب المتكرر أو انخفاض معدل الحضور للتواصل الفوري مع أولياء الأمور
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 shrink-0"
        >
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </Button>
      </CardHeader>

      {/* Card Content */}
      {!isCollapsed && (
        <CardContent className="p-4 sm:p-5 pt-3">
          {alertCount === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                          className="font-black text-sm text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {alert.studentName}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {alert.academicGrade || "غير محدد"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alert Reason Badge */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border ${
                        alert.alertType === "consecutive"
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-900"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-900"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{alert.reason}</span>
                    </span>
                  </div>

                  {/* WhatsApp Quick Action Button */}
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
        </CardContent>
      )}
    </Card>
  );
}
