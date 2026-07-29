"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, Phone, User, ArrowLeft, ShieldCheck, HeartHandshake } from "lucide-react";
import { findStudentByPhoneOrCode } from "@/lib/actions/student";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ParentSearchGatewayPage() {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingStudents, setMatchingStudents] = useState<
    Array<{ id: string; full_name: string; parent_token: string }> | null
  >(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setError("يرجى إدخال رقم الهاتف المسجل");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMatchingStudents(null);

    const res = await findStudentByPhoneOrCode(phoneInput);

    if (res.success) {
      if (res.token) {
        router.push(`/parent/${res.token}`);
      } else if (res.students && res.students.length > 0) {
        setMatchingStudents(res.students);
      }
    } else {
      setError(res.error || "لم يتم العثور على نتائج");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full mx-auto space-y-6 my-auto">
        {/* Top Header Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto shadow-xl">
            <BookOpen className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">
              بوابة أولياء الأمور
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              متابعة حفظ القرآن الكريم والحضور اليومي لأبنائكم
            </p>
          </div>
        </div>

        {/* Main Search Card */}
        <Card className="border-teal-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600" />
              <span>الاستعلام برقم الجوال</span>
            </CardTitle>
            <CardDescription className="text-xs">
              أدخل رقم الهاتف المسجل لدى معلم الحلقة لعرض التقرير الحي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            {!matchingStudents ? (
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-phone" className="text-xs font-bold">
                    رقم هاتف ولي الأمر
                  </Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="parent-phone"
                      type="tel"
                      placeholder="0781234567 أو 0512345678"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      dir="ltr"
                      className="pr-9 text-left font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-base font-bold gap-2 shadow-md"
                >
                  <Search className="w-4 h-4" />
                  <span>{isLoading ? "جاري البحث..." : "عرض تقرير الطالب 🔍"}</span>
                </Button>
              </form>
            ) : (
              /* Multiple Siblings Selection View */
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                  تم العثور على أكثر من طالب مسجل بهذا الرقم، اختر الطالب:
                </p>
                <div className="space-y-2">
                  {matchingStudents.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => router.push(`/parent/${st.parent_token}`)}
                      className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-600 bg-slate-50 dark:bg-slate-850 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-right flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {st.full_name}
                        </span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-teal-600 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMatchingStudents(null)}
                  className="w-full text-xs text-slate-500"
                >
                  بحث برقم آخر
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>بوابة آمنة ومخصصة لمتابعة حلقات التحفيظ</span>
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 py-2">
        <p>© {new Date().getFullYear()} متابع الحفظ - جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
