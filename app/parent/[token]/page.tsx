import { Metadata } from "next";
import { cache } from "react";
import { getStudentProgressByToken } from "@/lib/actions/parent";
import { AlertCircle } from "lucide-react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ParentProgressPayload } from "@/types";
import { ParentPortalClient } from "@/components/parent/ParentPortalClient";

export const revalidate = 0;

const getStudentProgressByTokenCached = cache(getStudentProgressByToken);

interface ParentPortalPageProps {
  params: {
    token: string;
  };
}

export async function generateMetadata({ params }: ParentPortalPageProps): Promise<Metadata> {
  try {
    const token = params?.token;
    if (!token) {
      return {
        title: "بوابة متابعة أولياء الأمور - متابع الحفظ",
      };
    }

    const payload = await getStudentProgressByTokenCached(token);

    if (payload && payload.success && payload.student) {
      const studentName = payload.student.full_name || "الطالب";
      return {
        title: `متابعة حفظ القرآن الكريم - ${studentName}`,
        description: `سجل الحفظ والمراجعة والحضور اليومي للطالب ${studentName} في الحلقة القرآنية`,
        openGraph: {
          title: `متابعة حفظ القرآن الكريم - ${studentName}`,
          description: `تقرير متابعة حقيقي لمستوى وإنجاز الطالب ${studentName} في حفظ وتسميع القرآن الكريم`,
          type: "website",
          locale: "ar_SA",
          siteName: "متابع الحفظ",
        },
        twitter: {
          card: "summary",
          title: `متابعة حفظ القرآن الكريم - ${studentName}`,
          description: `تقرير متابعة حقيقي لمستوى وإنجاز الطالب ${studentName} في حفظ وتسميع القرآن الكريم`,
        },
      };
    }
  } catch {
    // Fallback metadata on error
  }

  return {
    title: "بوابة متابعة أولياء الأمور - متابع الحفظ",
    description: "تقرير متابعة حفظ ومراجعة القرآن الكريم والحضور اليومي",
  };
}

export default async function ParentPortalPage({ params }: ParentPortalPageProps) {
  const token = params?.token;

  if (!token) {
    return renderErrorCard("الرابط غير صحيح أو مفقود");
  }

  const payload: ParentProgressPayload = await getStudentProgressByTokenCached(token);

  if (!payload || !payload.success || !payload.student) {
    return renderErrorCard(payload?.error || "الرابط غير صالح أو تم حذف بيانات الطالب");
  }

  const { student, logs = [], attendance = [] } = payload;

  return <ParentPortalClient student={student} logs={logs} attendance={attendance} />;
}

function renderErrorCard(message: string) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 border-rose-200 dark:border-rose-900 shadow-xl">
        <CardContent className="space-y-4 pt-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            الرابط غير صالح أو غير موجود
          </CardTitle>
          <CardDescription className="text-slate-500">
            {message || "يرجى التأكد من الحصول على رابط المتابعة الصحيح الخاص بابنكم من معلم الحلقة"}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
