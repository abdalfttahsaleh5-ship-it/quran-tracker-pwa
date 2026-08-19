import { Trash2 } from "lucide-react";
import { getDeletedStudentsCached } from "@/lib/actions/student";
import { TrashStudentList } from "@/components/teacher/TrashStudentList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrashPage() {
  const res = await getDeletedStudentsCached();
  const deletedStudents = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          <span>أرشيف المحذوفات (سلة المهملات)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          إدارة واستعادة الطلاب المحذوفين مؤقتاً وسجلاتهم السابقة بكامل تفاصيلها
        </p>
      </div>

      <TrashStudentList initialStudents={deletedStudents} />
    </div>
  );
}
