"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Award, Share2, Copy, Check, Sparkles, MessageCircle, ExternalLink, ShieldCheck, Volume2 } from "lucide-react";
import { StudentRow, MemorizationLogRow, AttendanceRecordRow } from "@/types";
import { calculateStudentBadges } from "@/lib/achievements";
import { generateParentPraiseMessage, generateWhatsAppShareUrl } from "@/lib/whatsappUtils";
import { formatCleanPageCount, getTimeframeDateBounds } from "@/lib/reportCalculations";
import { lightHaptic, successHaptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/common/AudioPlayer";

export interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRow;
  logs?: MemorizationLogRow[];
  attendance?: AttendanceRecordRow[];
  weeklyTopStudentId?: string;
}

export function ShareAchievementModal({
  isOpen,
  onClose,
  student,
  logs = [],
  attendance = [],
  weeklyTopStudentId,
}: ShareAchievementModalProps) {
  const [copied, setCopied] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Derived Student Stats
  const studentLogs = useMemo(() => {
    return logs.filter((l) => l.student_id === student.id);
  }, [logs, student.id]);

  const recentAudioLog = useMemo(() => {
    const sorted = [...studentLogs].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    return sorted.find((l) => Boolean(l.audio_url)) || null;
  }, [studentLogs]);

  const studentAttendance = useMemo(() => {
    return attendance.filter((a) => a.student_id === student.id);
  }, [attendance, student.id]);

  const totalPages = useMemo(() => {
    if (studentLogs.length > 0) {
      const raw = studentLogs.reduce((sum, l) => sum + (Number(l.page_count) || 1), 0);
      return formatCleanPageCount(raw);
    }
    return Number(student.total_pages_count || 0);
  }, [studentLogs, student.total_pages_count]);

  const recentSurah = useMemo(() => {
    if (studentLogs.length === 0) return null;
    const sorted = [...studentLogs].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    return sorted[0].surah_end || sorted[0].surah_start || null;
  }, [studentLogs]);

  const monthlyAttendanceRate = useMemo(() => {
    const bounds = getTimeframeDateBounds();
    const monthlyList = studentAttendance.filter(
      (a) => a.date >= bounds.startOfMonthStr && a.date <= bounds.todayStr
    );
    const uniqueMap = new Map<string, AttendanceRecordRow>();
    monthlyList.forEach((r) => uniqueMap.set(r.date, r));
    const unique = Array.from(uniqueMap.values());
    if (unique.length === 0) return 100;
    const present = unique.filter((a) => a.status === "حاضر" || a.status === "متأخر" || (a.status as string) === "present" || (a.status as string) === "late").length;
    return Math.round((present / unique.length) * 100);
  }, [studentAttendance]);

  const badges = useMemo(() => {
    return calculateStudentBadges(student, logs, attendance, weeklyTopStudentId);
  }, [student, logs, attendance, weeklyTopStudentId]);

  const unlockedBadgesCount = badges.filter((b) => b.isUnlocked).length;

  if (!isOpen) return null;

  const handleCopyMessage = async () => {
    lightHaptic();
    const msg = generateParentPraiseMessage(student, totalPages, monthlyAttendanceRate, recentSurah);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      successHaptic();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement("textarea");
      input.value = msg;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      successHaptic();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    lightHaptic();
    successHaptic();
    const url = generateWhatsAppShareUrl(student, totalPages, monthlyAttendanceRate, recentSurah);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-base sm:text-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <span>لوحة إنجازات الطالب والتهنئة 🌟</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Visual Digital Certificate Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 text-white p-5 shadow-xl border border-emerald-700/50">
            {/* Background Glow Overlay */}
            <div className="absolute -top-16 -left-16 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>وسام تميز قرآني</span>
                </span>
                <span className="text-xs text-emerald-200 font-bold">
                  {unlockedBadgesCount} / {badges.length} أوسمة مكتسبة
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center font-black text-2xl border border-white/20 shrink-0 shadow-inner">
                  {student.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-full h-full object-cover rounded-2xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{student.full_name.charAt(0)}</span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xl font-black tracking-tight">{student.full_name}</h3>
                  <p className="text-xs text-emerald-200/90 font-bold">
                    {student.academic_grade || "طالب حلقة القرآن"}
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-700/50 text-xs">
                <div className="bg-emerald-950/60 rounded-xl p-2 text-center border border-emerald-700/30">
                  <p className="text-emerald-300/80 text-[10px] font-bold">مجموع التسميع</p>
                  <p className="text-base font-black text-white">{totalPages} صفحة</p>
                </div>
                <div className="bg-emerald-950/60 rounded-xl p-2 text-center border border-emerald-700/30">
                  <p className="text-emerald-300/80 text-[10px] font-bold">نسبة الانضباط</p>
                  <p className="text-base font-black text-white">{monthlyAttendanceRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recorded Recitation Highlight Player (if available) */}
          {recentAudioLog?.audio_url && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300/80 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تلاوة مسجلة: سورة {recentAudioLog.surah_start}</span>
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  استمع لتلاوة الطالب المسجلة أثناء الجلسة
                </p>
              </div>
              <AudioPlayer src={recentAudioLog.audio_url} title={`سورة ${recentAudioLog.surah_start}`} />
            </div>
          )}

          {/* Badges Collection Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>الأوسمة والشارات الرقمية</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 ${
                    badge.isUnlocked
                      ? `bg-gradient-to-r ${badge.bgGradient} ${badge.color} shadow-sm`
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                  }`}
                >
                  <span className="text-2xl shrink-0 select-none">{badge.icon}</span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-black text-xs text-slate-900 dark:text-slate-100 truncate">
                        {badge.title}
                      </p>
                      {badge.isUnlocked && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                          مكتسب ✅
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                      {badge.description}
                    </p>
                    {badge.progressText && (
                      <p className="text-[9px] font-bold text-slate-500 pt-0.5">
                        {badge.progressText}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shrink-0">
          <Button
            onClick={handleOpenWhatsApp}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md gap-2 text-sm active:scale-98 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>إرسال تهنئة لولي الأمر عبر واتساب 💬</span>
          </Button>

          <Button
            variant={copied ? "default" : "outline"}
            onClick={handleCopyMessage}
            className={`w-full py-3 rounded-2xl font-bold gap-2 text-xs transition-all ${
              copied ? "bg-emerald-700 text-white" : "border-slate-200 dark:border-slate-700"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم نسخ نص التهنئة بنجاح!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>نسخ نص التهنئة لمشاركته 📋</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
