"use client";

import { useState } from "react";
import { CheckCircle2, UserCheck, Calendar, X, AlertCircle } from "lucide-react";
import { StudentRow, AttendanceStatusEnum } from "@/types";
import { recordBulkAttendance } from "@/lib/actions/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickAttendanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRow[];
  onSuccess?: () => void;
}

export function QuickAttendanceSheet({
  isOpen,
  onClose,
  students,
  onSuccess,
}: QuickAttendanceSheetProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatusEnum>>(() => {
    const initialMap: Record<string, AttendanceStatusEnum> = {};
    students.forEach((s) => {
      initialMap[s.id] = "حاضر"; // Default everyone to 'حاضر'
    });
    return initialMap;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatusEnum) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSetAll = (status: AttendanceStatusEnum) => {
    const newMap: Record<string, AttendanceStatusEnum> = {};
    students.forEach((s) => {
      newMap[s.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    const records = students.map((s) => ({
      student_id: s.id,
      date: selectedDate,
      status: attendanceMap[s.id] || "حاضر",
    }));

    const res = await recordBulkAttendance(records);

    if (res.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(res.error || "فشل حفظ الحضور الجماعي");
    }
    setIsLoading(false);
  };

  const statuses: Array<{ value: AttendanceStatusEnum; label: string; activeClass: string }> = [
    { value: "حاضر", label: "حاضر", activeClass: "bg-emerald-700 text-white" },
    { value: "غائب", label: "غائب", activeClass: "bg-rose-700 text-white" },
    { value: "مستأذن", label: "مستأذن", activeClass: "bg-amber-700 text-white" },
    { value: "متأخر", label: "متأخر", activeClass: "bg-orange-700 text-white" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-lg">
            <UserCheck className="w-5 h-5" />
            <span>تسجيل الحضور السريع للحلقة</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Date and Bulk Set Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">التاريخ:</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 w-auto text-xs"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 ml-1">تحديد الكل:</span>
            <button
              onClick={() => handleSetAll("حاضر")}
              className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold"
            >
              الكل حاضر
            </button>
            <button
              onClick={() => handleSetAll("غائب")}
              className="px-2 py-1 text-xs rounded bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold"
            >
              الكل غائب
            </button>
          </div>
        </div>

        {/* Student List Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {students.length > 0 ? (
            students.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {st.full_name}
                </span>

                <div className="flex items-center gap-1">
                  {statuses.map((s) => {
                    const isSelected = attendanceMap[st.id] === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleStatusChange(st.id, s.value)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                          isSelected
                            ? `${s.activeClass} border-transparent shadow-sm`
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-8 text-sm">لا يوجد طلاب مسجلون في الحلقة بعد</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || students.length === 0} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? "جاري الحفظ..." : `حفظ حضور ${students.length} طالب`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
