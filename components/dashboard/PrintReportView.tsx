"use client";

import React from "react";
import { StudentRow } from "@/types";

export interface StudentReportItem {
  student: StudentRow;
  attendanceText: string;
  pagesCount: number;
  totalPresentCount: number;
}

interface PrintReportViewProps {
  reportItems: StudentReportItem[];
  periodLabel: string;
}

export function PrintReportView({ reportItems, periodLabel }: PrintReportViewProps) {
  const currentDateFormatted = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="printable-report-only hidden print:block text-slate-900 bg-white p-4 font-sans text-xs dir-rtl">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 12mm 10mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          /* Hide all app navigation controls during print */
          header,
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          th,
          td {
            padding: 5px 8px !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Official A4 Header */}
      <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-3 mb-4">
        <div>
          <h1 className="text-xl font-black text-emerald-950">سجل متابعة حلقة القرآن الكريم 📜</h1>
          <p className="text-xs font-bold text-slate-600 mt-1">
            تقرير الإدارة التفصيلي — <span className="text-emerald-800 font-extrabold">{periodLabel}</span>
          </p>
        </div>
        <div className="text-left text-[11px] text-slate-500 font-bold space-y-0.5">
          <p>تاريخ التقرير: {currentDateFormatted}</p>
          <p>إجمالي الطلاب: {reportItems.length} طالب</p>
        </div>
      </div>

      {/* High-density Printable Table with Balanced Column Layout */}
      <table className="w-full text-right border-collapse border border-slate-300">
        <thead>
          <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
            <th className="p-2 border border-slate-300 w-10 text-center">#</th>
            <th className="p-2 border border-slate-300 w-1/3">اسم الطالب</th>
            <th className="p-2 border border-slate-300 text-center w-1/6">الصف الدراسي</th>
            <th className="p-2 border border-slate-300 text-center w-1/6">حالة الحضور</th>
            <th className="p-2 border border-slate-300 text-center w-1/6">الصفحات المنفذة</th>
            <th className="p-2 border border-slate-300 text-center w-1/6">رقم ولي الأمر</th>
          </tr>
        </thead>
        <tbody>
          {reportItems.map((item, index) => (
            <tr key={item.student.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
              <td className="p-2 border border-slate-300 text-center font-bold">{index + 1}</td>
              <td className="p-2 border border-slate-300 font-bold text-slate-900">{item.student.full_name}</td>
              <td className="p-2 border border-slate-300 text-center">{item.student.academic_grade || "غير محدد"}</td>
              <td className="p-2 border border-slate-300 text-center font-bold text-emerald-950 dir-ltr">
                {item.attendanceText}
              </td>
              <td className="p-2 border border-slate-300 text-center font-extrabold text-emerald-900">
                {item.pagesCount > 0 ? `${item.pagesCount} صفحة` : "—"}
              </td>
              <td className="p-2 border border-slate-300 text-center font-mono dir-ltr">
                {item.student.parent_phone || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Official Sign-off Footer */}
      <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-xs font-bold text-slate-700">
        <div>توقيع معلم الحلقة: ..............................</div>
        <div>اعتماد مشرف الحلقة: ..............................</div>
      </div>
    </div>
  );
}


