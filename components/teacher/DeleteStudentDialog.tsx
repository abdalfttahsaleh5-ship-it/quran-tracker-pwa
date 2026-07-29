"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  studentName?: string;
  isLoading?: boolean;
}

export function DeleteStudentDialog({
  isOpen,
  onClose,
  onConfirm,
  studentName = "",
  isLoading = false,
}: DeleteStudentDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-right">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
            <AlertTriangle className="w-5 h-5" />
            <span>تأكيد حذف الطالب</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          هل أنت تأكد من رغبتك في حذف الطالب{" "}
          <strong className="text-slate-900 dark:text-slate-50 font-bold">"{studentName}"</strong>؟
          سيتم حذف جميع سجلات الحفظ والحضور المرتبطة به نهائياً.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "جاري الحذف..." : "تأكيد الحذف"}
          </Button>
        </div>
      </div>
    </div>
  );
}
