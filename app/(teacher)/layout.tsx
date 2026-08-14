import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { RoutePrefetcher } from "@/components/common/RoutePrefetcher";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AppFooter } from "@/components/common/AppFooter";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <RoutePrefetcher />
      {/* Top Header */}
      <Header />

      {/* Main Teacher Content Area with Bottom Padding for Mobile Nav */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Global Mosque Footer */}
      <AppFooter />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}
