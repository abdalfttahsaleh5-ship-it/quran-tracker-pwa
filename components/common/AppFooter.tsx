"use client";

import React from "react";
import { BookOpen, HeartHandshake, MapPin } from "lucide-react";
import { SocialLinks } from "./SocialLinks";

export interface AppFooterProps {
  className?: string;
  showMosqueDetails?: boolean;
}

export function AppFooter({
  className = "",
  showMosqueDetails = true,
}: AppFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`no-print print:hidden mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          {/* Mosque & Platform Identity */}
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4 text-amber-300" />
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                حلقات مسجد حذيفة بن اليمان
              </h4>
            </div>

            {showMosqueDetails && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>عمان - طبربور • متابعة وإتقان القرآن الكريم</span>
              </p>
            )}
          </div>

          {/* Social Channels Action */}
          <div className="flex flex-col items-center sm:items-end gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              تابع أنشطة وإعلانات المسجد:
            </span>
            <SocialLinks iconSize="md" />
          </div>
        </div>

        {/* Bottom Rights Bar */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
          <p className="flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span>نعتز بخدمة كتاب الله عز وجل وتنشئة جيل القرآن</span>
          </p>
          <p>© {currentYear} متابع الحفظ • جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
