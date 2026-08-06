import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { PwaInstallPrompt } from "@/components/common/PwaInstallPrompt";
import { RoutePrefetcher } from "@/components/common/RoutePrefetcher";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "متابع الحفظ - سجل تحفيظ القرآن الكريم",
    template: "%s | متابع الحفظ",
  },
  description: "تطبيق متكامل للمعلمين وأولياء الأمور لمتابعة حفظ القرآن الكريم والمراجعة والحضور اليومي",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "متابع الحفظ",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="antialiased selection:bg-teal-100 selection:text-teal-900 pt-6 sm:pt-0">
        <RoutePrefetcher />
        <OfflineBanner />
        <main className="min-h-screen flex flex-col">{children}</main>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
