/**
 * Jordanian Phone Number Utility
 *
 * Handles strict validation, normalization, and variation generation for Jordanian mobile numbers.
 * Supported Networks:
 * - Zain: 079 (core: 79XXXXXXX)
 * - Orange: 077 (core: 77XXXXXXX)
 * - Umniah: 078 (core: 78XXXXXXX)
 */

export interface JordanianPhoneResult {
  isValid: boolean;
  core?: string; // 8 digits (e.g., "791234567")
  local?: string; // Local 10 digits (e.g., "0791234567")
  international?: string; // E.164 formatted (e.g., "+962791234567")
  cleanIntl?: string; // Digits-only international (e.g., "962791234567")
  variations: string[]; // Safe set of representations for DB lookup matching
  error?: string;
}

const JORDAN_MOBILE_REGEX = /^(?:\+?962|00962|0)?(7[789]\d{7})$/;

/**
 * Validates and normalizes Jordanian phone numbers across local and international formats.
 *
 * Accepted input formats:
 * - Local: 079XXXXXXX, 078XXXXXXX, 077XXXXXXX
 * - International: +96279XXXXXXX, 0096279XXXXXXX, 96279XXXXXXX
 * - Formatted/Spaced: "079 123 4567", "+962-78-1234567", "(077) 1234567"
 * - Eastern Arabic Numerals: "٠٧٩١٢٣٤٥٦٧"
 */
export function validateAndFormatJordanianPhone(rawInput?: string | null): JordanianPhoneResult {
  if (!rawInput || typeof rawInput !== "string" || rawInput.trim() === "") {
    return {
      isValid: false,
      error: "يرجى إدخال رقم هاتف أردني صحيح (مثال: 0791234567 أو +962791234567)",
      variations: [],
    };
  }

  // 1. Convert Eastern Arabic numerals (٠-٩) to standard ASCII numerals (0-9)
  const westernized = rawInput.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());

  // 2. Strip all whitespace, dashes, parentheses, dots, slashes, and non-digit characters (preserving leading '+')
  const cleanStr = westernized.replace(/[\s\-\(\)\/\.]/g, "");

  // 3. Match against strict Jordanian mobile regex
  const match = cleanStr.match(JORDAN_MOBILE_REGEX);

  if (!match || !match[1]) {
    return {
      isValid: false,
      error: "يرجى إدخال رقم هاتف أردني صحيح (مثال: 0791234567 أو +962791234567)",
      variations: [],
    };
  }

  // Extract core 8 digits starting with 77, 78, or 79
  const core = match[1]; // e.g. "791234567"
  const local = `0${core}`; // e.g. "0791234567"
  const international = `+962${core}`; // e.g. "+962791234567"
  const cleanIntl = `962${core}`; // e.g. "962791234567"
  const doubleZero = `00962${core}`; // e.g. "00962791234567"

  // Variations list for secure parameterized database queries (.in('parent_phone', variations))
  const variations = [local, international, cleanIntl, doubleZero, core];

  return {
    isValid: true,
    core,
    local,
    international,
    cleanIntl,
    variations,
  };
}
