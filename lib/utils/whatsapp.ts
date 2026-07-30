/**
 * Normalizes Jordanian phone numbers for WhatsApp API link generation (https://wa.me/<number>).
 *
 * Examples:
 * - "0791234567" -> "962791234567"
 * - "078-123-4567" -> "962781234567"
 * - "+962791234567" -> "962791234567"
 * - "00962791234567" -> "962791234567"
 * - "962791234567" -> "962791234567"
 */
export function formatJordanPhone(phone: string): string {
  if (!phone) return "";

  // Remove spaces, dashes, pluses, parentheses, and non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Handle leading 00962 (e.g. 00962791234567 -> 962791234567)
  if (digits.startsWith("00962")) {
    digits = digits.slice(2);
  }

  // Handle local Jordanian format starting with 07 (e.g. 0791234567 -> 962791234567)
  if (digits.startsWith("07")) {
    digits = "962" + digits.slice(1);
  } else if (!digits.startsWith("962") && digits.startsWith("7") && digits.length === 9) {
    // Handle 9-digit format starting with 7 (e.g. 791234567 -> 962791234567)
    digits = "962" + digits;
  }

  return digits;
}

/**
 * Generates a direct WhatsApp link using `https://wa.me/<formatted_phone>`.
 */
export function getWhatsAppLink(phone: string, text?: string): string {
  const formattedPhone = formatJordanPhone(phone);
  if (!formattedPhone) return "#";
  const baseUrl = `https://wa.me/${formattedPhone}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}
