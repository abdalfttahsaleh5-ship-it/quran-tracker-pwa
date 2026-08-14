"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Trophy, Printer, Calendar } from "lucide-react";
import { StudentRow, MemorizationLogRow } from "@/types";
import { lightHaptic } from "@/lib/haptics";

export interface TopStudentItem {
  student: StudentRow;
  totalPages: number;
  rank: number;
}

export type TimeframeOption = "this_week" | "7_days" | "10_days" | "14_days" | "30_days";

interface TopStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRow[];
  logs: MemorizationLogRow[];
}

export function TopStudentsModal({
  isOpen,
  onClose,
  students,
  logs,
}: TopStudentsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "period">("period");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("7_days");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scrolling when modal is open
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

  // Calculate start date based on selected timeframe option
  const getStartDate = (tf: TimeframeOption): Date | null => {
    const now = new Date();

    switch (tf) {
      case "this_week": {
        // Sunday of current week (Arabic week starts on Sunday)
        const day = now.getDay(); // 0 = Sunday
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        return startDate;
      }
      case "7_days":
        return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      case "10_days":
        return new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      case "14_days":
        return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      case "30_days":
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  // Calculate total pages for each student and rank top 5 according to activeTab and timeframe
  const topStudents: TopStudentItem[] = useMemo(() => {
    const startDate = activeTab === "all" ? null : getStartDate(timeframe);

    return students
      .map((student) => {
        const studentLogs = logs.filter((l) => {
          if (l.student_id !== student.id) return false;
          if (startDate) {
            if (!l.created_at) return false;
            const logDate = new Date(l.created_at);
            return !isNaN(logDate.getTime()) && logDate >= startDate;
          }
          return true;
        });

        const totalPagesSum = studentLogs.reduce(
          (sum, l) => sum + (l.page_count || 1),
          0
        );
        const totalPages = Number(totalPagesSum.toFixed(1));
        return { student, totalPages };
      })
      .filter((item) => item.totalPages > 0)
      .sort((a, b) => b.totalPages - a.totalPages)
      .slice(0, 5)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [students, logs, activeTab, timeframe]);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getTimeframeLabel = (tf: TimeframeOption, isAll: boolean) => {
    if (isAll) return "العام (الكلي)";
    switch (tf) {
      case "this_week":
        return "الأسبوع الحالي (من الأحد)";
      case "7_days":
        return "آخر 7 أيام";
      case "10_days":
        return "أسبوع ونصف (10 أيام)";
      case "14_days":
        return "أسبوعان (14 يوم)";
      case "30_days":
        return "شهر كامل (30 يوم)";
      default:
        return "الفترة المحددة";
    }
  };

  const getPrintTitle = (tf: TimeframeOption, isAll: boolean) => {
    if (isAll) return "لوحة شرف متميزي حلقة القرآن الكريم (عام)";
    switch (tf) {
      case "this_week": return "لوحة شرف متميزي الأسبوع الحالي في القرآن الكريم";
      case "7_days": return "لوحة شرف متميزي الأيام السبعة الماضية";
      case "10_days": return "لوحة شرف متميزي الـ 10 أيام الماضية (أسبوع ونصف)";
      case "14_days": return "لوحة شرف متميزي الأسبوعين الماضيين (14 يوم)";
      case "30_days": return "لوحة شرف متميزي الشهر الماضي (30 يوم)";
      default: return "لوحة شرف متميزي الفترة المحددة";
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          label: "🥇 المركز الأول",
          cardStyle: "bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/5 border-amber-400/80 dark:border-amber-700 text-amber-950 dark:text-amber-200 shadow-md",
          badgeStyle: "bg-amber-400 text-amber-950 border border-amber-300 font-black",
          icon: "👑",
        };
      case 2:
        return {
          label: "🥈 المركز الثاني",
          cardStyle: "bg-gradient-to-r from-slate-300/30 via-slate-200/20 to-slate-300/10 border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-slate-200 shadow-sm",
          badgeStyle: "bg-slate-200 text-slate-800 border border-slate-300 font-black",
          icon: "🥈",
        };
      case 3:
        return {
          label: "🥉 المركز الثالث",
          cardStyle: "bg-gradient-to-r from-orange-400/15 via-orange-300/10 to-orange-400/5 border-orange-300/70 dark:border-orange-800 text-orange-950 dark:text-orange-200 shadow-sm",
          badgeStyle: "bg-orange-300 text-orange-950 border border-orange-200 font-black",
          icon: "🥉",
        };
      case 4:
        return {
          label: "4️⃣ المركز الرابع",
          cardStyle: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200",
          badgeStyle: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold",
          icon: "4️⃣",
        };
      default:
        return {
          label: "5️⃣ المركز الخامس",
          cardStyle: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200",
          badgeStyle: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold",
          icon: "5️⃣",
        };
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-lg sm:text-xl">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <span>الطلاب الأوائل 🏆 (لوحة الشرف)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2 shrink-0 bg-white dark:bg-slate-900 space-y-2.5">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                lightHaptic();
                setActiveTab("all");
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 shadow-sm font-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold"
              }`}
            >
              <span>🌐</span>
              <span>العام (الكل)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                lightHaptic();
                setActiveTab("period");
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === "period"
                  ? "bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 shadow-sm font-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold"
              }`}
            >
              <span>📅</span>
              <span>فترة محددة</span>
            </button>
          </div>

          {activeTab === "period" && (
            <div className="flex items-center gap-2 bg-amber-50/60 dark:bg-amber-950/20 p-2 rounded-2xl border border-amber-200/70 dark:border-amber-900/40">
              <Calendar className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 shrink-0">
                الفترة:
              </span>
              <select
                value={timeframe}
                onChange={(e) => {
                  lightHaptic();
                  setTimeframe(e.target.value as TimeframeOption);
                }}
                className="flex-1 bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-800 rounded-xl px-2.5 py-1 text-xs font-black text-amber-950 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="this_week">الأسبوع الحالي (من الأحد)</option>
                <option value="7_days">آخر 7 أيام</option>
                <option value="10_days">أسبوع ونصف (10 أيام)</option>
                <option value="14_days">أسبوعان (14 يوم)</option>
                <option value="30_days">شهر كامل (30 يوم)</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain webkit-overflow-scrolling-touch scroll-smooth touch-pan-y">
          {topStudents.length > 0 ? (
            topStudents.map((item) => {
              const rankInfo = getRankBadge(item.rank);

              return (
                <div
                  key={item.student.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${rankInfo.cardStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm shadow-sm shrink-0 ${rankInfo.badgeStyle}`}
                      >
                        {rankInfo.icon}
                      </div>

                      <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                        {item.student.avatar_url ? (
                          <img
                            src={item.student.avatar_url}
                            alt={item.student.full_name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="select-none">{item.student.full_name.charAt(0)}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-50">
                          {item.student.full_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {item.student.academic_grade || "غير محدد"} • {rankInfo.label}
                      </p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black border border-emerald-300 dark:border-emerald-800">
                      📖 {item.totalPages} صفحة
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm font-bold">
              {activeTab === "period"
                ? `لا يوجد تسميعات مسجلة للطلاب خلال (${getTimeframeLabel(timeframe, false)})`
                : "لا يوجد تسميعات مسجلة للطلاب بعد"}
            </p>
          )}
        </div>

        <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 z-20 shadow-lg flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-base active:scale-98 transition-all"
          >
            <Printer className="w-5 h-5" />
            <span>طباعة لوحة الشرف 🖨️</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Printable Honor Roll Sheet (hidden on screen, isolated on print) */}
      <div className="printable-honor-roll hidden print:block text-slate-900 bg-white p-4 font-sans dir-rtl">
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            body {
              background-color: white !important;
              color: black !important;
            }
            /* Strict print isolation for Honor Roll sheet */
            header,
            nav,
            footer,
            aside,
            .print\\:hidden,
            .printable-report-only {
              display: none !important;
            }
            .printable-honor-roll {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            table {
              page-break-inside: avoid !important;
            }
            tr {
              page-break-inside: avoid !important;
            }
          }
        `}</style>

        {/* Printable Honor Roll Header */}
        <div className="text-center border-b-4 border-amber-500 pb-3 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs mb-1.5">
            <span>
              🏆 لوحة الشرف والتميز ({getTimeframeLabel(timeframe, activeTab === "all")}) 🏆
            </span>
          </div>
          <h1 className="text-2xl font-black text-emerald-950">
            {getPrintTitle(timeframe, activeTab === "all")}
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-1">
            الطلاب الأوائل الأكثر إنجازاً في التسميع والحفظ —{" "}
            <span className="text-emerald-900 font-black">
              {getTimeframeLabel(timeframe, activeTab === "all")}
            </span>{" "}
            — <span className="text-emerald-800 font-extrabold">{currentDateFormatted}</span>
          </p>
        </div>

        {/* Printable Honor Roll Table (Fits Single A4 Page) */}
        <table className="w-full text-right border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-amber-100 text-amber-950 font-black border-b-2 border-amber-400">
              <th className="p-2.5 border border-slate-300 w-16 text-center">الترتيب</th>
              <th className="p-2.5 border border-slate-300">اسم الطالب المتميز</th>
              <th className="p-2.5 border border-slate-300 text-center">الصف الدراسي</th>
              <th className="p-2.5 border border-slate-300 text-center">إجمالي الصفحات المنجزة</th>
            </tr>
          </thead>
          <tbody>
            {topStudents.length > 0 ? (
              topStudents.map((item) => {
                const rankInfo = getRankBadge(item.rank);
                return (
                  <tr key={item.student.id} className="border-b border-slate-300">
                    <td className="p-2.5 border border-slate-300 text-center font-black text-sm">
                      {rankInfo.icon}
                    </td>
                    <td className="p-2.5 border border-slate-300 font-black text-sm text-slate-900">
                      {item.student.full_name}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-slate-700">
                      {item.student.academic_grade || "غير محدد"}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center font-black text-emerald-900 text-sm">
                      📖 {item.totalPages} صفحة
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500 font-bold">
                  {activeTab === "period"
                    ? `لا يوجد تسميعات مسجلة للطلاب خلال (${getTimeframeLabel(timeframe, false)})`
                    : "لا يوجد تسميعات مسجلة للطلاب بعد"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Sign-off Footer */}
        <div className="mt-10 pt-4 border-t-2 border-slate-300 flex justify-between items-center text-xs font-bold text-slate-700">
          <div>توقيع معلم الحلقة: ..............................</div>
          <div>اعتماد مشرف الحلقة: ..............................</div>
        </div>
      </div>

      {createPortal(modalContent, document.body)}
    </>
  );
}
