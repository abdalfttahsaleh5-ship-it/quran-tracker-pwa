import Link from "next/link";
import { BookOpen, ShieldCheck, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-teal-950 dark:text-teal-100">
                متابع الحفظ
              </h1>
              <p className="text-xs text-slate-500">نظام متابعة تحفيظ القرآن الكريم</p>
            </div>
          </div>
          <Link href="/login">
            <Button variant="default" className="gap-2">
              <span>تسجيل الدخول للمعلم</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>تطبيق آمن ومرتبط بقواعد بيانات Supabase RLS</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 leading-tight mb-6">
          تطبيق إلكتروني متكامل لمتابعة <span className="text-teal-700 dark:text-teal-400">حفظ القرآن الكريم</span>
        </h2>

        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-8">
          منصة سهلة وبسيطة تُتيح للمعلمين تسجيل الحفظ والمراجعة والحضور اليومي، وتمكّن اولياء الأمور من متابعة إنجاز أبنائهم عبر روابط خاصة وآمنة دون الحاجة لإنشاء حسابات.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-base gap-2 shadow-lg shadow-teal-700/20">
              <Users className="w-5 h-5" />
              <span>دخول بوابة المعلمين</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} متابع الحفظ - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
