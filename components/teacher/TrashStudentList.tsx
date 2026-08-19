"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Trash2,
  Search,
  ArrowRight,
  Phone,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  User,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";
import { StudentRow } from "@/types";
import { restoreStudent } from "@/lib/actions/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { formatArabicDate } from "@/lib/utils";
import { lightHaptic, successHaptic, warningHaptic } from "@/lib/haptics";

interface TrashStudentListProps {
  initialStudents: StudentRow[];
}

export function TrashStudentList({ initialStudents }: TrashStudentListProps) {
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToRestore, setStudentToRestore] = useState<StudentRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredStudents = useMemoSearch(students, searchQuery);

  const handleOpenRestoreConfirm = (student: StudentRow) => {
    lightHaptic();
    setStudentToRestore(student);
  };

  const handleConfirmRestore = async () => {
    if (!studentToRestore) return;

    setIsLoading(true);
    setAlertMessage(null);

    try {
      const res = await restoreStudent(studentToRestore.id);
      if (res.success) {
        successHaptic();
        // Optimistically remove from deleted list
        setStudents((prev) => prev.filter((s) => s.id !== studentToRestore.id));
        setAlertMessage({
          type: "success",
          text: `تمت استعادة الطالب "${studentToRestore.full_name}" إلى كشوفات الحلقة بنجاح!`,
        });
        setStudentToRestore(null);
      } else {
        warningHaptic();
        setAlertMessage({
          type: "error",
          text: res.error || "فشل استعادة الطالب، يرجى المحاولة لاحقاً",
        });
      }
    } catch {
      warningHaptic();
      setAlertMessage({
        type: "error",
        text: "حدث خطأ غير متوقع أثناء استعادة الطالب",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notification Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold flex items-center justify-between border shadow-sm transition-all animate-in fade-in duration-200 ${
            alertMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            className="text-xs underline hover:opacity-80"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Top Action Bar: Search & Back Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="بحث باسم الطالب المحذوف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/students">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة الطلاب النشطين</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Deleted Students Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => {
            const formattedDeletedDate = student.deleted_at
              ? formatArabicDate(student.deleted_at)
              : "غير محدد";
            const totalPages = Number(
              student.total_pages_memorized ?? student.total_pages_count ?? 0
            );

            return (
              <Card
                key={student.id}
                className="hover:shadow-md transition-all border-rose-100 dark:border-rose-950/50 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Top Subtle Red Banner */}
                <div className="h-1.5 bg-gradient-to-r from-rose-500 to-amber-500 w-full" />

                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold shrink-0 border border-rose-200 dark:border-rose-900 shadow-inner">
                      {student.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={student.avatar_url}
                          alt={student.full_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-base select-none">
                          {student.full_name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50 truncate flex items-center gap-1.5">
                        <span className="truncate">{student.full_name}</span>
                        {student.academic_grade && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            {student.academic_grade}
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>تم الحذف: {formattedDeletedDate}</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  {/* Total Completed Pages Snapshot */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>إجمالي الحفظ السابق:</span>
                    </span>
                    <span className="font-mono font-black text-teal-700 dark:text-teal-400">
                      {totalPages > 0 ? `${totalPages.toFixed(1)} صفحة` : "0 صفحة"}
                    </span>
                  </div>

                  {/* Parent Phone */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>هاتف ولي الأمر:</span>
                    <span dir="ltr" className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {student.parent_phone || "غير مسجل"}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                  <Button
                    onClick={() => handleOpenRestoreConfirm(student)}
                    variant="outline"
                    className="w-full min-h-[40px] gap-2 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-sm transition-all rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>استعادة الطالب إلى الحلقة 🔄</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto shadow-inner">
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200">
              {searchQuery
                ? "لا يوجد طلاب محذوفون يطابقون اسم البحث"
                : "سلة المهملات فارغة حالياً ✨"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery
                ? "تأكد من كتابة الاسم بشكل صحيح أو امسح حقل البحث"
                : "لا يوجد طلاب في الأرشيف المؤقت. عند حذف أي طالب، سيظهر هنا وتستطيع استعادته بكامل بياناته في أي وقت."}
            </p>
          </div>

          {!searchQuery && (
            <Link href="/students">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl mt-2">
                <ArrowRight className="w-4 h-4" />
                <span>الذهاب لكشوفات الطلاب</span>
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Confirmation Modal for Restore */}
      {studentToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-right animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-base">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <span>تأكيد استعادة الطالب</span>
              </div>
              <button
                type="button"
                onClick={() => setStudentToRestore(null)}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                هل أنت متأكد من رغبتك في استعادة الطالب{" "}
                <strong className="text-emerald-800 dark:text-emerald-300 font-black">
                  "{studentToRestore.full_name}"
                </strong>{" "}
                إلى كشوفات الحلقة النشطة؟
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                💡 <strong>ملاحظة:</strong> ستتم استعادة ملف الطالب تلقائياً مع ربطه بكافة سجلات
                التسميع والحضور والإحصائيات السابقة دون أي فقدان للبيانات.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setStudentToRestore(null)}
                disabled={isLoading}
                className="rounded-xl font-bold text-xs"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleConfirmRestore}
                disabled={isLoading}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs gap-2 shadow-md shadow-emerald-700/20"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "جاري الاستعادة..." : "تأكيد الاستعادة ✅"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function useMemoSearch(students: StudentRow[], query: string): StudentRow[] {
  if (!query.trim()) return students;
  const q = query.trim().toLowerCase();
  return students.filter((s) => s.full_name.toLowerCase().includes(q));
}
