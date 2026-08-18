import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { PwaInstallPrompt } from "@/components/common/PwaInstallPrompt";
import { PWAProvider } from "@/components/common/PWAProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "متابع الحفظ - مسجد حذيفة بن اليمان",
    template: "%s | متابع الحفظ",
  },
  description: "تطبيق متابعة تحفيظ وإتقان القرآن الكريم والحضور اليومي - حلقات مسجد حذيفة بن اليمان طبربور",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "متابع الحفظ",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.deferredPwaPrompt = e;
                  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-emerald-100 selection:text-emerald-900 pt-safe pb-safe">
        <PWAProvider />
        <OfflineBanner />
        <ErrorBoundary>
          <main className="min-h-screen flex flex-col">{children}</main>
        </ErrorBoundary>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
