import { getStudents } from "@/lib/actions/student";
import { StudentList } from "@/components/teacher/StudentList";

export const revalidate = 0;

export default async function StudentsPage() {
  const res = await getStudents();
  const students = res.success && res.data ? res.data : [];

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

      <StudentList initialStudents={students} />
    </div>
  );
}
