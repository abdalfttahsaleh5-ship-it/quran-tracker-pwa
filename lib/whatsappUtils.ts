import { StudentRow } from "@/types";
import { validateAndFormatJordanianPhone } from "@/lib/phoneUtils";

/**
 * Normalizes phone number into international format suitable for wa.me links.
 */
export function cleanWhatsAppPhoneNumber(phone?: string | null): string {
  if (!phone) return "";

  // Check if it's a valid Jordanian mobile number
  const jordanianRes = validateAndFormatJordanianPhone(phone);
  if (jordanianRes.isValid && jordanianRes.cleanIntl) {
    return jordanianRes.cleanIntl;
  }

  // Fallback normalization for non-standard or other international numbers
  const westernized = phone.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  let digitsOnly = westernized.replace(/\D/g, "");

  if (digitsOnly.startsWith("00")) {
    digitsOnly = digitsOnly.substring(2);
  }

  // Common country defaults for GCC/Jordan
  if (digitsOnly.startsWith("07") && digitsOnly.length === 10) {
    // Jordan: 07XXXXXXXX -> 9627XXXXXXXX
    digitsOnly = "962" + digitsOnly.substring(1);
  } else if (digitsOnly.startsWith("05") && digitsOnly.length === 10) {
    // Saudi: 05XXXXXXXX -> 9665XXXXXXXX
    digitsOnly = "966" + digitsOnly.substring(1);
  } else if (digitsOnly.startsWith("01") && digitsOnly.length === 11) {
    // Egypt: 01XXXXXXXXX -> 201XXXXXXXXX
    digitsOnly = "2" + digitsOnly;
  }

  return digitsOnly;
}

/**
 * Formats a polite, inspiring congratulations message for the student's parents.
 */
export function generateParentPraiseMessage(
  student: StudentRow,
  totalPages: number,
  monthlyAttendanceRate: number,
  recentSurah?: string | null,
  appOrigin: string = ""
): string {
  const portalUrl = student.parent_token
    ? `${appOrigin || (typeof window !== "undefined" ? window.location.origin : "")}/parent/${student.parent_token}`
    : "";

  const lines = [
    "السلام عليكم ورحمة الله وبركاته 🌸",
    "",
    `يسر إدارة حلقة القرآن الكريم أن تبارك لكم تميز ابننا البطل: *${student.full_name}* ✨`,
    "",
    `📖 مجموع التسميع المنجز: *${totalPages} صفحة*`,
    recentSurah ? `🎯 آخر ما تم تسميعه: *${recentSurah.startsWith("سورة") ? recentSurah : `سورة ${recentSurah}`}*` : "",
    `🌟 نسبة الانضباط والحضور: *${monthlyAttendanceRate}%*`,
    "",
    portalUrl ? `🔗 رابط متابعة إنجازات الطالب المباشرة:\n${portalUrl}\n` : "",
    "نسأل الله أن يجعله من أهل القرآن وخاصته، وبارك الله في جهودكم المباركة 🌿",
  ].filter(Boolean);

  return lines.join("\n");
}

/**
 * Generates direct wa.me link for WhatsApp sharing.
 */
export function generateWhatsAppShareUrl(
  student: StudentRow,
  totalPages: number,
  monthlyAttendanceRate: number,
  recentSurah?: string | null,
  appOrigin: string = ""
): string {
  const cleanPhone = cleanWhatsAppPhoneNumber(student.parent_phone);
  const text = generateParentPraiseMessage(student, totalPages, monthlyAttendanceRate, recentSurah, appOrigin);
  const encoded = encodeURIComponent(text);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
