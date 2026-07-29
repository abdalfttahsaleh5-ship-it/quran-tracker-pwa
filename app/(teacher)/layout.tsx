import Link from "next/link";
import { BookOpen, LayoutDashboard, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutTeacher } from "@/lib/actions/auth";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Teacher Top Navigation */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" prefetch={true} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-slate-50 hidden sm:inline">
                متابع الحفظ
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                prefetch={true}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-600" />
                <span>اللوحة الرئيسية</span>
              </Link>

              <Link
                href="/students"
                prefetch={true}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Users className="w-4 h-4 text-teal-600" />
                <span>قائمة الطلاب</span>
              </Link>

              <Link
                href="/parent"
                prefetch={true}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-teal-800 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 hover:bg-teal-100"
              >
                <span>دخول أولياء الأمور 🔍</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <form action={logoutTeacher}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Teacher Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
