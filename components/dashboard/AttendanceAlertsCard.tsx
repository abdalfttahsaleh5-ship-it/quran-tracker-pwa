"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { StudentRow, AttendanceRecordRow } from "@/types";
import { getAttendanceAlerts, AttendanceAlert } from "@/lib/attendanceAlerts";
import { markStudentContacted } from "@/lib/actions/student";
import {
  AlertTriangle,
  MessageSquare,
  X,
  ShieldAlert,
  CheckCircle2,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceAlertsCardProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRow[];
  attendance: AttendanceRecordRow[];
  onStudentContacted?: (studentId: string) => void;
}

export function AttendanceAlertsCard({
  isOpen,
  onClose,
  students,
  attendance,
  onStudentContacted,
}: AttendanceAlertsCardProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "contacted">("pending");
  const [localContactedIds, setLocalContactedIds] = useState<Set<string>>(new Set());
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setSuccessMessage(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const allAlerts: AttendanceAlert[] = useMemo(() => {
    return getAttendanceAlerts(students, attendance);
  }, [students, attendance]);

  const pendingAlerts = useMemo(() => {
    return allAlerts.filter(
      (alert) => !alert.isContacted && !localContactedIds.has(alert.studentId)
    );
  }, [allAlerts, localContactedIds]);

  const contactedAlerts = useMemo(() => {
    return allAlerts.filter(
      (alert) => alert.isContacted || localContactedIds.has(alert.studentId)
    );
  }, [allAlerts, localContactedIds]);

  const handleMarkContacted = async (studentId: string, studentName: string) => {
    try {
      setLoadingStudentId(studentId);

      // Optimistic update
      setLocalContactedIds((prev) => new Set(prev).add(studentId));
      if (onStudentContacted) {
        onStudentContacted(studentId);
      }

      setSuccessMessage(`تم توثيق التواصل مع ولي أمر الطالب (${studentName}) بنجاح ✓`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);

      // Server Action call
      const result = await markStudentContacted(studentId);
      if (!result.success) {
        // Rollback on server error
        setLocalContactedIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
        setSuccessMessage(`تعذر حفظ التواصل: ${result.error}`);
      }
    } catch {
      setLocalContactedIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      setSuccessMessage("حدث خطأ غير متوقع أثناء تسجيل التواصل");
    } finally {
      setLoadingStudentId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:hidden animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header Section */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-black text-lg sm:text-xl">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span>متابعة غياب الطلاب 🔔</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-2 px-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-2 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "pending"
                ? "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>بحاجة لمتابعة</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "pending"
                  ? "bg-rose-500 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {pendingAlerts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contacted")}
            className={`flex-1 py-2 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "contacted"
                ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>تم التواصل ✓</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "contacted"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {contactedAlerts.length}
            </span>
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {successMessage && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-200 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1 Content: Pending Alerts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {activeTab === "pending" && (
            <>
              {pendingAlerts.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                    تم التواصل مع جميع الطلاب المتغيبين ✨
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    لا يوجد أي طلاب بانتظار المتابعة حالياً.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAlerts.map((alert) => {
                    const isLoading = loadingStudentId === alert.studentId;

                    return (
                      <div
                        key={alert.studentId}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-amber-200/80 dark:border-amber-900/50 shadow-sm flex flex-col justify-between gap-3 hover:border-amber-400 transition-all"
                      >
                        {/* Student Info & Alert Badge */}
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

                        {/* Action Buttons Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {/* 1. WhatsApp Button (Does not auto-mark contacted) */}
                          {alert.formattedWhatsAppUrl ? (
                            <a
                              href={alert.formattedWhatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full"
                            >
                              <Button
                                type="button"
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                              >
                                <MessageSquare className="w-4 h-4 fill-current" />
                                <span>واتساب ولي الأمر 💬</span>
                              </Button>
                            </a>
                          ) : (
                            <Button
                              type="button"
                              disabled
                              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>الرقم غير مسجل</span>
                            </Button>
                          )}

                          {/* 2. Mark Contacted Button (Records last_contacted_at) */}
                          <Button
                            type="button"
                            onClick={() => handleMarkContacted(alert.studentId, alert.studentName)}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full py-2 border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-[0.98] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري الحفظ...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>✅ تم التواصل</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Tab 2 Content: Contacted Alerts */}
          {activeTab === "contacted" && (
            <>
              {contactedAlerts.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 mx-auto flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    لم يتم تسجيل أي تواصل بعد
                  </p>
                  <p className="text-xs text-slate-500">
                    عند الضغط على «تم التواصل» لأي طالب سينتقل إلى هذا القسم.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium text-center">
                    💡 تم توثيق التواصل. سيعود الطالب تلقائياً للتنبيهات إذا سُجل له أي غياب جديد مستقبلاً.
                  </div>

                  {contactedAlerts.map((alert) => (
                    <div
                      key={alert.studentId}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-emerald-200/80 dark:border-emerald-900/50 shadow-sm flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-black text-sm shrink-0">
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

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900 shrink-0">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>تم التواصل ✓</span>
                        </span>
                      </div>

                      {/* WhatsApp Option still available if teacher wants to message again */}
                      {alert.formattedWhatsAppUrl && (
                        <a
                          href={alert.formattedWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full py-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>إعادة إرسال رسالة عبر واتساب 💬</span>
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
