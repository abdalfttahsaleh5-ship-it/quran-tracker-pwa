"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, UserPlus, Users, CalendarCheck, Mic } from "lucide-react";
import { StudentRow, AttendanceRecordRow, MemorizationLogRow } from "@/types";
import { getAttendanceAlertsMap } from "@/lib/attendanceAlerts";
import { StudentInput } from "@/lib/validations/student";
import { createStudent, updateStudent, deleteStudent } from "@/lib/actions/student";
import { StudentCard } from "./StudentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRealtimeSync, RealtimePayload } from "@/lib/hooks/useRealtimeSync";

const StudentDialog = dynamic(() => import("./StudentDialog").then((mod) => mod.StudentDialog), { ssr: false });
const DeleteStudentDialog = dynamic(() => import("./DeleteStudentDialog").then((mod) => mod.DeleteStudentDialog), { ssr: false });
const QuickAttendanceSheet = dynamic(() => import("./QuickAttendanceSheet").then((mod) => mod.QuickAttendanceSheet), { ssr: false });
const LiveRecitationModal = dynamic(() => import("./LiveRecitationModal").then((mod) => mod.LiveRecitationModal), { ssr: false });

interface StudentListProps {
  initialStudents: StudentRow[];
  initialAttendance?: AttendanceRecordRow[];
  initialLogs?: MemorizationLogRow[];
  logs?: any[];
}

export function StudentList({
  initialStudents,
  initialAttendance = [],
  initialLogs = [],
  logs: propLogs,
}: StudentListProps) {
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [logs, setLogs] = useState<MemorizationLogRow[]>(propLogs || initialLogs || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "pages">("name");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false);
  const [isLiveRecitationOpen, setIsLiveRecitationOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Realtime payload handler for instant student list & logs sync
  const handleRealtimePayload = useCallback((payload: RealtimePayload) => {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    if (table === "students") {
      if (eventType === "INSERT" && newRecord) {
        setStudents((prev) => [newRecord as unknown as StudentRow, ...prev.filter((s) => s.id !== newRecord.id)]);
      } else if (eventType === "DELETE" && oldRecord && oldRecord.id) {
        setStudents((prev) => prev.filter((s) => s.id !== oldRecord.id));
      } else if (eventType === "UPDATE" && newRecord) {
        setStudents((prev) =>
          prev.map((s) => (s.id === newRecord.id ? (newRecord as unknown as StudentRow) : s))
        );
      }
    }
    if (table === "memorization_logs") {
      if (eventType === "INSERT" && newRecord) {
        setLogs((prev) => [newRecord as unknown as MemorizationLogRow, ...prev.filter((l) => l.id !== newRecord.id)]);
      } else if (eventType === "DELETE" && oldRecord && oldRecord.id) {
        setLogs((prev) => prev.filter((l) => l.id !== oldRecord.id));
      } else if (eventType === "UPDATE" && newRecord) {
        setLogs((prev) =>
          prev.map((l) => (l.id === newRecord.id ? (newRecord as unknown as MemorizationLogRow) : l))
        );
      }
    }
  }, []);

  const { notification } = useRealtimeSync({
    tables: ["students", "memorization_logs"],
    onPayload: handleRealtimePayload,
  });

  // Dynamic pages sum map for accurate sorting
  const studentPagesMap = useMemo(() => {
    const map: Record<string, number> = {};
    (logs || []).forEach((log) => {
      const sid = String(log.student_id || "");
      if (sid) {
        const p = Number(log.page_count ?? 1);
        map[sid] = (map[sid] || 0) + (isNaN(p) ? 0 : p);
      }
    });
    return map;
  }, [logs]);

  // Compute attendance alerts for student cards
  const alertsMap = useMemo(() => {
    return getAttendanceAlertsMap(students, initialAttendance);
  }, [students, initialAttendance]);

  const filteredStudents = students
    .filter((s) => s.full_name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "pages") {
        const pagesB = studentPagesMap[b.id] ?? (b.total_pages_count || 0);
        const pagesA = studentPagesMap[a.id] ?? (a.total_pages_count || 0);
        return pagesB - pagesA;
      }
      return a.full_name.localeCompare(b.full_name, "ar");
    });

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (student: StudentRow) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (student: StudentRow) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveStudent = async (data: StudentInput) => {
    setIsLoading(true);
    setAlertMessage(null);

    if (selectedStudent) {
      const res = await updateStudent(selectedStudent.id, data);
      if (res.success && res.data) {
        setStudents((prev) =>
          prev.map((s) => (s.id === selectedStudent.id ? res.data! : s))
        );
        setAlertMessage({ type: "success", text: "تم تحديث بيانات الطالب بنجاح" });
      } else {
        setAlertMessage({ type: "error", text: res.error || "فشل التحديث" });
      }
    } else {
      const res = await createStudent(data);
      if (res.success && res.data) {
        setStudents((prev) => [res.data!, ...prev]);
        setAlertMessage({ type: "success", text: "تمت إضافة الطالب بنجاح" });
      } else {
        setAlertMessage({ type: "error", text: res.error || "فشلت الإضافة" });
      }
    }

    setIsLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    setIsLoading(true);
    setAlertMessage(null);

    const res = await deleteStudent(selectedStudent.id);
    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      setAlertMessage({ type: "success", text: "تم حذف الطالب بنجاح" });
      setIsDeleteDialogOpen(false);
    } else {
      setAlertMessage({ type: "error", text: res.error || "فشل الحذف" });
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="p-3 bg-teal-800 text-white font-bold text-xs rounded-xl shadow-lg animate-in slide-in-from-top duration-300 flex items-center justify-center gap-2">
          <span>{notification}</span>
        </div>
      )}

      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${
            alertMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage(null)} className="text-xs text-slate-500 underline">
            إغلاق
          </button>
        </div>
      )}

      {/* Top Controls: Search Bar, Sort Picker, Quick Attendance & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="بحث باسم الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "pages")}
            className="h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="name">الترتيب الأبجدي (حسب الاسم)</option>
            <option value="pages">الترتيب حسب الأكثر تسميعاً (عدد الصفحات) 🏆</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsLiveRecitationOpen(true)}
            className="gap-2 shadow-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
          >
            <Mic className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>بدء التسميع المباشر 🎙️</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsQuickAttendanceOpen(true)}
            className="gap-2 shadow-sm border-teal-200 text-teal-800 hover:bg-teal-50"
          >
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <span>تحضير الحلقة اليوم</span>
          </Button>

          <Button onClick={handleOpenAdd} className="gap-2 shadow-sm">
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </Button>
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              logs={logs}
              alert={alertsMap.get(student.id)}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {searchQuery ? "لا توجد نتائج مطابقة لاسم البحث" : "لا يوجد طلاب مسجلون بعد"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? "تأكد من كتابة الاسم بشكل صحيح أو جرب كلمة بحث أخرى"
                : "ابدأ بإضافة أول طالب في الحلقة لتوليد رابط المتابعة الخاص بولي أمره ومتابعة التسميع والحضور"}
            </p>
          </div>
          {!searchQuery && (
            <Button onClick={handleOpenAdd} className="gap-2 mt-2">
              <UserPlus className="w-4 h-4" />
              <span>إضافة طالب جديد</span>
            </Button>
          )}
        </div>
      )}

      {/* Dialog Modals */}
      <StudentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSaveStudent}
        student={selectedStudent}
        isLoading={isLoading}
      />

      <DeleteStudentDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        studentName={selectedStudent?.full_name}
        isLoading={isLoading}
      />

      <QuickAttendanceSheet
        isOpen={isQuickAttendanceOpen}
        onClose={() => setIsQuickAttendanceOpen(false)}
        students={students}
        onSuccess={() => setAlertMessage({ type: "success", text: "تم تسجيل حضور الحلقة بنجاح!" })}
      />

      <LiveRecitationModal
        isOpen={isLiveRecitationOpen}
        onClose={() => setIsLiveRecitationOpen(false)}
        students={students}
        logs={logs}
      />
    </div>
  );
}
