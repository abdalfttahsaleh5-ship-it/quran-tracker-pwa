import Link from "next/link";
import { Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrashPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-600" />
            <span>أرشيف المحذوفات</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة الطلاب أو السجلات المحذوفة مؤقتاً
          </p>
        </div>

        <Link href="/students" prefetch={false}>
          <Button variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للطلاب</span>
          </Button>
        </Link>
      </div>

      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <Trash2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">سلة المهملات فارغة حالياً</h3>
        <p className="text-xs text-slate-500">لا يوجد عناصر محذوفة في الوقت الحالي.</p>
      </div>
    </div>
  );
}
