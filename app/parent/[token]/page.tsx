import { BookOpen, Calendar, Award, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ParentPortalPageProps {
  params: {
    token: string;
  };
}

export default function ParentPortalPage({ params }: ParentPortalPageProps) {
  const { token } = params;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 text-white shadow-xl overflow-hidden">
          <CardHeader className="space-y-3 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-teal-200" />
                </div>
                <span className="text-sm font-medium text-teal-200">بوابة ولي الأمر</span>
              </div>
              <Badge variant="outline" className="border-teal-400/30 text-teal-200 gap-1 bg-white/5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>رابط مشفّر وخاص</span>
              </Badge>
            </div>

            <div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-white">
                تقرير متابعة حفظ الطالب
              </CardTitle>
              <CardDescription className="text-teal-200 mt-1">
                عرض حي ومُحدث مباشرة لسجل التسميع والحضور في الحلقة القرأنية
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 font-normal">إجمالي صفحات/سور الحفظ</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-black text-teal-700">--</span>
              <Award className="w-6 h-6 text-amber-500" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 font-normal">نسبة الحضور</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
              <span className="text-2xl font-black text-teal-700">-- %</span>
              <Calendar className="w-6 h-6 text-teal-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 font-normal">رمز التوثيق الخاص</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-xs font-mono text-slate-400 truncate block dir-ltr text-right">
                {token.slice(0, 8)}...
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Memorization Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span>سجل التسميع والمراجعة اليومي</span>
            </CardTitle>
            <CardDescription>
              يتم تحديث هذا السجل فور اعتماد المعلم للتسميع اليومي
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12 text-slate-500">
            <p>لا توجد سجلات حفظ مضافة حالياً بهذا الرمز.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
