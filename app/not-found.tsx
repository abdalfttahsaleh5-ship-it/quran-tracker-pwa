import Link from "next/link";
import { BookOpen, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-teal-800 dark:text-teal-300">404</h1>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
            عذراً، الصفحة غير موجودة
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            الرابط الذي تحاول الوصول إليه غير موجود أو تم تغييره. يرجى التأكد من الرابط أو العودة للرئيسية.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button className="w-full gap-2 text-base h-11">
              <Home className="w-4 h-4" />
              <span>العودة إلى الصفحة الرئيسية</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
