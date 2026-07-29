"use client";

import { useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { StudentRow } from "@/types";
import { StudentInput } from "@/lib/validations/student";
import { createStudent, updateStudent, deleteStudent } from "@/lib/actions/student";
import { StudentCard } from "./StudentCard";
import { StudentDialog } from "./StudentDialog";
import { DeleteStudentDialog } from "./DeleteStudentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StudentListProps {
  initialStudents: StudentRow[];
}

export function StudentList({ initialStudents }: StudentListProps) {
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

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
      // Update existing student
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
      // Create new student
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

      {/* Top Controls: Search Bar & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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

        <Button onClick={handleOpenAdd} className="gap-2 shadow-sm">
          <UserPlus className="w-4 h-4" />
          <span>إضافة طالب جديد</span>
        </Button>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
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
    </div>
  );
}
