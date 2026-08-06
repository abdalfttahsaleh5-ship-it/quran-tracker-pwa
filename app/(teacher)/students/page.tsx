import { getTeacherReportDataCached } from "@/lib/actions/student";
import { StudentList } from "@/components/teacher/StudentList";

export const revalidate = 0;

export default async function StudentsPage() {
  const res = await getTeacherReportDataCached();
  const students = res.success && res.students ? res.students : [];
  const attendance = res.success && res.attendance ? res.attendance : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">
          إدارة طلاب الحلقة
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          إضافة وتعديل بيانات الطلاب ونسخ رابط متابعة أولياء الأمور
        </p>
      </div>

      <StudentList initialStudents={students} initialAttendance={attendance} />
    </div>
  );
}
