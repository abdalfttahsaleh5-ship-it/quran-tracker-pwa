"use client";

import React from "react";
import { Instagram, Facebook } from "lucide-react";
import { lightHaptic } from "@/lib/haptics";

export interface SocialLinksProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

// Custom X (Twitter) Vector Icon
function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={className || "w-4 h-4"}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export const OFFICIAL_SOCIAL_LINKS = [
  {
    id: "instagram",
    name: "إنستغرام",
    title: "تابعنا على إنستغرام",
    url: "https://www.instagram.com/ms_ebn_elyamman",
    icon: Instagram,
    hoverClass:
      "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:shadow-md hover:shadow-rose-500/20",
    colorClass: "text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50",
  },
  {
    id: "facebook",
    name: "فيسبوك",
    title: "صفحتنا على فيسبوك",
    url: "https://www.facebook.com/p/مسجد-حذيفة-بن-اليمان-طبربور-100093678310272/",
    icon: Facebook,
    hoverClass:
      "hover:bg-[#1877F2] hover:text-white hover:border-transparent hover:shadow-md hover:shadow-blue-500/20",
    colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
  },
  {
    id: "x_twitter",
    name: "منصة إكس",
    title: "حسابنا على منصة إكس (تويتر)",
    url: "https://x.com/ms_ebn_elyamman",
    icon: XTwitterIcon,
    hoverClass:
      "hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 hover:border-transparent hover:shadow-md",
    colorClass: "text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700",
  },
];

export function SocialLinks({
  className = "",
  iconSize = "md",
  showLabels = false,
}: SocialLinksProps) {
  const sizeClasses = {
    sm: "w-8 h-8 p-1.5 rounded-xl",
    md: "w-9 h-9 p-2 rounded-xl",
    lg: "w-11 h-11 p-2.5 rounded-2xl",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {OFFICIAL_SOCIAL_LINKS.map((item) => {
        const Icon = item.icon;

        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.title}
            aria-label={item.title}
            onClick={() => lightHaptic()}
            className={`group inline-flex items-center justify-center gap-1.5 transition-all duration-200 border transform active:scale-95 ${
              showLabels ? "px-3 py-1.5 rounded-xl text-xs font-bold" : sizeClasses[iconSize]
            } ${item.colorClass} ${item.hoverClass}`}
          >
            <Icon className={`${iconSizes[iconSize]} transition-transform duration-200 group-hover:scale-110`} />
            {showLabels && <span className="text-xs font-bold">{item.name}</span>}
          </a>
        );
      })}
    </div>
  );
}
