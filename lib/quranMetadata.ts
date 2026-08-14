export interface SurahMeta {
  id: number;
  name: string;
  type: "مكية" | "مدنية";
  numberOfAyahs: number;
  startPage: number;
  endPage: number;
  standardPages: number; // Standard page count in Madani Mushaf
}

export const SURAH_METADATA: SurahMeta[] = [
  { id: 1, name: "الفاتحة", type: "مكية", numberOfAyahs: 7, startPage: 1, endPage: 1, standardPages: 1.0 },
  { id: 2, name: "البقرة", type: "مدنية", numberOfAyahs: 286, startPage: 2, endPage: 49, standardPages: 48.0 },
  { id: 3, name: "آل عمران", type: "مدنية", numberOfAyahs: 200, startPage: 50, endPage: 76, standardPages: 27.0 },
  { id: 4, name: "النساء", type: "مدنية", numberOfAyahs: 176, startPage: 77, endPage: 106, standardPages: 29.5 },
  { id: 5, name: "المائدة", type: "مدنية", numberOfAyahs: 120, startPage: 106, endPage: 127, standardPages: 21.5 },
  { id: 6, name: "الأنعام", type: "مكية", numberOfAyahs: 165, startPage: 128, endPage: 150, standardPages: 23.0 },
  { id: 7, name: "الأعراف", type: "مكية", numberOfAyahs: 206, startPage: 151, endPage: 176, standardPages: 26.0 },
  { id: 8, name: "الأنفال", type: "مدنية", numberOfAyahs: 75, startPage: 177, endPage: 186, standardPages: 10.0 },
  { id: 9, name: "التوبة", type: "مدنية", numberOfAyahs: 129, startPage: 187, endPage: 207, standardPages: 21.0 },
  { id: 10, name: "يونس", type: "مكية", numberOfAyahs: 109, startPage: 208, endPage: 221, standardPages: 13.5 },
  { id: 11, name: "هود", type: "مكية", numberOfAyahs: 123, startPage: 221, endPage: 235, standardPages: 14.0 },
  { id: 12, name: "يوسف", type: "مكية", numberOfAyahs: 111, startPage: 235, endPage: 248, standardPages: 13.5 },
  { id: 13, name: "الرعد", type: "مدنية", numberOfAyahs: 43, startPage: 249, endPage: 255, standardPages: 6.5 },
  { id: 14, name: "إبراهيم", type: "مكية", numberOfAyahs: 52, startPage: 255, endPage: 261, standardPages: 6.5 },
  { id: 15, name: "الحجر", type: "مكية", numberOfAyahs: 99, startPage: 262, endPage: 267, standardPages: 5.5 },
  { id: 16, name: "النحل", type: "مكية", numberOfAyahs: 128, startPage: 267, endPage: 281, standardPages: 14.5 },
  { id: 17, name: "الإسراء", type: "مكية", numberOfAyahs: 111, startPage: 282, endPage: 293, standardPages: 11.5 },
  { id: 18, name: "الكهف", type: "مكية", numberOfAyahs: 110, startPage: 293, endPage: 304, standardPages: 11.5 },
  { id: 19, name: "مريم", type: "مكية", numberOfAyahs: 98, startPage: 305, endPage: 312, standardPages: 7.5 },
  { id: 20, name: "طه", type: "مكية", numberOfAyahs: 135, startPage: 312, endPage: 321, standardPages: 9.5 },
  { id: 21, name: "الأنبياء", type: "مكية", numberOfAyahs: 112, startPage: 322, endPage: 331, standardPages: 10.0 },
  { id: 22, name: "الحج", type: "مدنية", numberOfAyahs: 78, startPage: 332, endPage: 341, standardPages: 10.0 },
  { id: 23, name: "المؤمنون", type: "مكية", numberOfAyahs: 118, startPage: 342, endPage: 349, standardPages: 8.0 },
  { id: 24, name: "النور", type: "مدنية", numberOfAyahs: 64, startPage: 350, endPage: 359, standardPages: 9.5 },
  { id: 25, name: "الفرقان", type: "مكية", numberOfAyahs: 77, startPage: 359, endPage: 366, standardPages: 7.5 },
  { id: 26, name: "الشعراء", type: "مكية", numberOfAyahs: 227, startPage: 367, endPage: 376, standardPages: 10.0 },
  { id: 27, name: "النمل", type: "مكية", numberOfAyahs: 93, startPage: 377, endPage: 385, standardPages: 8.5 },
  { id: 28, name: "القصص", type: "مكية", numberOfAyahs: 88, startPage: 385, endPage: 396, standardPages: 11.5 },
  { id: 29, name: "العنكبوت", type: "مكية", numberOfAyahs: 69, startPage: 396, endPage: 404, standardPages: 8.5 },
  { id: 30, name: "الروم", type: "مكية", numberOfAyahs: 60, startPage: 404, endPage: 410, standardPages: 6.5 },
  { id: 31, name: "لقمان", type: "مكية", numberOfAyahs: 34, startPage: 411, endPage: 414, standardPages: 4.0 },
  { id: 32, name: "السجدة", type: "مكية", numberOfAyahs: 30, startPage: 415, endPage: 417, standardPages: 3.0 },
  { id: 33, name: "الأحزاب", type: "مدنية", numberOfAyahs: 73, startPage: 418, endPage: 427, standardPages: 10.0 },
  { id: 34, name: "سبأ", type: "مكية", numberOfAyahs: 54, startPage: 428, endPage: 434, standardPages: 6.5 },
  { id: 35, name: "فاطر", type: "مكية", numberOfAyahs: 45, startPage: 434, endPage: 440, standardPages: 6.5 },
  { id: 36, name: "يس", type: "مكية", numberOfAyahs: 83, startPage: 440, endPage: 445, standardPages: 5.5 },
  { id: 37, name: "الصافات", type: "مكية", numberOfAyahs: 182, startPage: 445, endPage: 452, standardPages: 7.5 },
  { id: 38, name: "ص", type: "مكية", numberOfAyahs: 88, startPage: 453, endPage: 458, standardPages: 5.5 },
  { id: 39, name: "الزمر", type: "مكية", numberOfAyahs: 75, startPage: 458, endPage: 467, standardPages: 9.5 },
  { id: 40, name: "غافر", type: "مكية", numberOfAyahs: 85, startPage: 467, endPage: 476, standardPages: 9.5 },
  { id: 41, name: "فصلت", type: "مكية", numberOfAyahs: 54, startPage: 477, endPage: 482, standardPages: 6.0 },
  { id: 42, name: "الشورى", type: "مكية", numberOfAyahs: 53, startPage: 483, endPage: 489, standardPages: 6.5 },
  { id: 43, name: "الزخرف", type: "مكية", numberOfAyahs: 89, startPage: 489, endPage: 495, standardPages: 6.5 },
  { id: 44, name: "الدخان", type: "مكية", numberOfAyahs: 59, startPage: 496, endPage: 498, standardPages: 3.0 },
  { id: 45, name: "الجاثية", type: "مكية", numberOfAyahs: 37, startPage: 499, endPage: 502, standardPages: 4.0 },
  { id: 46, name: "الأحقاف", type: "مكية", numberOfAyahs: 35, startPage: 502, endPage: 506, standardPages: 4.5 },
  { id: 47, name: "محمد", type: "مدنية", numberOfAyahs: 38, startPage: 507, endPage: 510, standardPages: 4.0 },
  { id: 48, name: "الفتح", type: "مدنية", numberOfAyahs: 29, startPage: 511, endPage: 515, standardPages: 4.5 },
  { id: 49, name: "الحجرات", type: "مدنية", numberOfAyahs: 18, startPage: 515, endPage: 517, standardPages: 2.5 },
  { id: 50, name: "ق", type: "مكية", numberOfAyahs: 45, startPage: 518, endPage: 520, standardPages: 2.5 },
  { id: 51, name: "الذاريات", type: "مكية", numberOfAyahs: 60, startPage: 520, endPage: 523, standardPages: 3.0 },
  { id: 52, name: "الطور", type: "مكية", numberOfAyahs: 49, startPage: 523, endPage: 525, standardPages: 2.5 },
  { id: 53, name: "النجم", type: "مكية", numberOfAyahs: 62, startPage: 526, endPage: 528, standardPages: 2.5 },
  { id: 54, name: "القمر", type: "مكية", numberOfAyahs: 55, startPage: 528, endPage: 531, standardPages: 2.5 },
  { id: 55, name: "الرحمن", type: "مدنية", numberOfAyahs: 78, startPage: 531, endPage: 534, standardPages: 3.0 },
  { id: 56, name: "الواقعة", type: "مكية", numberOfAyahs: 96, startPage: 534, endPage: 537, standardPages: 3.5 },
  { id: 57, name: "الحديد", type: "مدنية", numberOfAyahs: 29, startPage: 537, endPage: 541, standardPages: 4.5 },
  { id: 58, name: "المجادلة", type: "مدنية", numberOfAyahs: 22, startPage: 542, endPage: 545, standardPages: 3.5 },
  { id: 59, name: "الحشر", type: "مدنية", numberOfAyahs: 24, startPage: 545, endPage: 548, standardPages: 3.5 },
  { id: 60, name: "الممتحنة", type: "مدنية", numberOfAyahs: 13, startPage: 549, endPage: 551, standardPages: 2.5 },
  { id: 61, name: "الصف", type: "مدنية", numberOfAyahs: 14, startPage: 551, endPage: 553, standardPages: 2.0 },
  { id: 62, name: "الجمعة", type: "مدنية", numberOfAyahs: 11, startPage: 553, endPage: 554, standardPages: 1.5 },
  { id: 63, name: "المنافقون", type: "مدنية", numberOfAyahs: 11, startPage: 554, endPage: 556, standardPages: 1.5 },
  { id: 64, name: "التغابن", type: "مدنية", numberOfAyahs: 18, startPage: 556, endPage: 558, standardPages: 2.0 },
  { id: 65, name: "الطلاق", type: "مدنية", numberOfAyahs: 12, startPage: 558, endPage: 560, standardPages: 2.0 },
  { id: 66, name: "التحريم", type: "مدنية", numberOfAyahs: 12, startPage: 560, endPage: 562, standardPages: 2.0 },
  { id: 67, name: "الملك", type: "مكية", numberOfAyahs: 30, startPage: 562, endPage: 564, standardPages: 2.5 },
  { id: 68, name: "القلم", type: "مكية", numberOfAyahs: 52, startPage: 564, endPage: 566, standardPages: 2.0 },
  { id: 69, name: "الحاقة", type: "مكية", numberOfAyahs: 52, startPage: 566, endPage: 568, standardPages: 2.0 },
  { id: 70, name: "المعارج", type: "مكية", numberOfAyahs: 44, startPage: 568, endPage: 570, standardPages: 2.0 },
  { id: 71, name: "نوح", type: "مكية", numberOfAyahs: 28, startPage: 570, endPage: 571, standardPages: 1.5 },
  { id: 72, name: "الجن", type: "مكية", numberOfAyahs: 28, startPage: 572, endPage: 573, standardPages: 2.0 },
  { id: 73, name: "المزمل", type: "مكية", numberOfAyahs: 20, startPage: 574, endPage: 575, standardPages: 1.5 },
  { id: 74, name: "المدثر", type: "مكية", numberOfAyahs: 56, startPage: 575, endPage: 577, standardPages: 2.0 },
  { id: 75, name: "القيامة", type: "مكية", numberOfAyahs: 40, startPage: 577, endPage: 578, standardPages: 1.5 },
  { id: 76, name: "الإنسان", type: "مدنية", numberOfAyahs: 31, startPage: 578, endPage: 580, standardPages: 2.0 },
  { id: 77, name: "المرسلات", type: "مكية", numberOfAyahs: 50, startPage: 580, endPage: 581, standardPages: 1.5 },
  // Juz 30 (Surahs 78 to 114) — Sum is exactly 23.0 pages
  { id: 78, name: "النبأ", type: "مكية", numberOfAyahs: 40, startPage: 582, endPage: 583, standardPages: 1.5 },
  { id: 79, name: "النازعات", type: "مكية", numberOfAyahs: 46, startPage: 583, endPage: 584, standardPages: 1.5 },
  { id: 80, name: "عبس", type: "مكية", numberOfAyahs: 42, startPage: 585, endPage: 585, standardPages: 1.0 },
  { id: 81, name: "التكوير", type: "مكية", numberOfAyahs: 29, startPage: 586, endPage: 586, standardPages: 1.0 },
  { id: 82, name: "الانفطار", type: "مكية", numberOfAyahs: 19, startPage: 587, endPage: 587, standardPages: 0.5 },
  { id: 83, name: "المطففين", type: "مكية", numberOfAyahs: 36, startPage: 587, endPage: 589, standardPages: 2.0 },
  { id: 84, name: "الانشقاق", type: "مكية", numberOfAyahs: 25, startPage: 589, endPage: 590, standardPages: 1.0 },
  { id: 85, name: "البروج", type: "مكية", numberOfAyahs: 22, startPage: 590, endPage: 591, standardPages: 1.0 },
  { id: 86, name: "الطارق", type: "مكية", numberOfAyahs: 17, startPage: 591, endPage: 591, standardPages: 0.5 },
  { id: 87, name: "الأعلى", type: "مكية", numberOfAyahs: 19, startPage: 591, endPage: 592, standardPages: 0.5 },
  { id: 88, name: "الغاشية", type: "مكية", numberOfAyahs: 26, startPage: 592, endPage: 593, standardPages: 1.0 },
  { id: 89, name: "الفجر", type: "مكية", numberOfAyahs: 30, startPage: 593, endPage: 594, standardPages: 1.25 },
  { id: 90, name: "البلد", type: "مكية", numberOfAyahs: 20, startPage: 594, endPage: 595, standardPages: 0.75 },
  { id: 91, name: "الشمس", type: "مكية", numberOfAyahs: 15, startPage: 595, endPage: 595, standardPages: 0.5 },
  { id: 92, name: "الليل", type: "مكية", numberOfAyahs: 21, startPage: 595, endPage: 596, standardPages: 0.5 },
  { id: 93, name: "الضحى", type: "مكية", numberOfAyahs: 11, startPage: 596, endPage: 596, standardPages: 0.25 },
  { id: 94, name: "الشرح", type: "مكية", numberOfAyahs: 8, startPage: 596, endPage: 596, standardPages: 0.25 },
  { id: 95, name: "التين", type: "مكية", numberOfAyahs: 8, startPage: 597, endPage: 597, standardPages: 0.35 },
  { id: 96, name: "العلق", type: "مكية", numberOfAyahs: 19, startPage: 597, endPage: 597, standardPages: 0.65 },
  { id: 97, name: "القدر", type: "مكية", numberOfAyahs: 5, startPage: 598, endPage: 598, standardPages: 0.25 },
  { id: 98, name: "البينة", type: "مدنية", numberOfAyahs: 8, startPage: 598, endPage: 599, standardPages: 1.0 },
  { id: 99, name: "الزلزلة", type: "مدنية", numberOfAyahs: 8, startPage: 599, endPage: 599, standardPages: 0.4 },
  { id: 100, name: "العاديات", type: "مكية", numberOfAyahs: 11, startPage: 599, endPage: 600, standardPages: 0.5 },
  { id: 101, name: "القارعة", type: "مكية", numberOfAyahs: 11, startPage: 600, endPage: 600, standardPages: 0.45 },
  { id: 102, name: "التكاثر", type: "مكية", numberOfAyahs: 8, startPage: 600, endPage: 600, standardPages: 0.4 },
  { id: 103, name: "العصر", type: "مكية", numberOfAyahs: 3, startPage: 601, endPage: 601, standardPages: 0.33 },
  { id: 104, name: "الهمزة", type: "مكية", numberOfAyahs: 9, startPage: 601, endPage: 601, standardPages: 0.34 },
  { id: 105, name: "الفيل", type: "مكية", numberOfAyahs: 5, startPage: 601, endPage: 601, standardPages: 0.33 },
  { id: 106, name: "قريش", type: "مكية", numberOfAyahs: 4, startPage: 602, endPage: 602, standardPages: 0.33 },
  { id: 107, name: "الماعون", type: "مكية", numberOfAyahs: 7, startPage: 602, endPage: 602, standardPages: 0.34 },
  { id: 108, name: "الكوثر", type: "مكية", numberOfAyahs: 3, startPage: 602, endPage: 602, standardPages: 0.33 },
  { id: 109, name: "الكافرون", type: "مكية", numberOfAyahs: 6, startPage: 603, endPage: 603, standardPages: 0.34 },
  { id: 110, name: "النصر", type: "مدنية", numberOfAyahs: 3, startPage: 603, endPage: 603, standardPages: 0.33 },
  { id: 111, name: "المسد", type: "مكية", numberOfAyahs: 5, startPage: 603, endPage: 603, standardPages: 0.33 },
  { id: 112, name: "الإخلاص", type: "مكية", numberOfAyahs: 4, startPage: 604, endPage: 604, standardPages: 0.33 },
  { id: 113, name: "الفلق", type: "مكية", numberOfAyahs: 5, startPage: 604, endPage: 604, standardPages: 0.33 },
  { id: 114, name: "الناس", type: "مكية", numberOfAyahs: 6, startPage: 604, endPage: 604, standardPages: 0.34 },
];

/**
 * Find surah metadata by ID or Arabic name
 */
export function getSurahMetadata(nameOrId: string | number): SurahMeta | undefined {
  if (typeof nameOrId === "number") {
    return SURAH_METADATA.find((s) => s.id === nameOrId);
  }
  const cleanName = nameOrId.replace(/^سورة\s*/, "").trim();
  return SURAH_METADATA.find((s) => s.name === cleanName || s.name === nameOrId);
}

/**
 * Get standardized page count for a single Surah
 */
export function getSurahStandardPages(nameOrId: string | number): number {
  const surah = getSurahMetadata(nameOrId);
  return surah ? surah.standardPages : 1.0;
}

/**
 * Calculate total pages for a recitation range (single surah or cross-surahs, with optional ayah bounds)
 */
export function calculateRecitationPages(
  fromSurahNameOrId: string | number,
  toSurahNameOrId?: string | number,
  fromAyah: number = 1,
  toAyah?: number
): number {
  const startSurah = getSurahMetadata(fromSurahNameOrId);
  if (!startSurah) return 1.0;

  const targetSurah = toSurahNameOrId ? getSurahMetadata(toSurahNameOrId) : startSurah;
  const endSurah = targetSurah || startSurah;

  // Case 1: Same Surah
  if (startSurah.id === endSurah.id) {
    const endAyahVal = typeof toAyah === "number" && toAyah > 0 ? toAyah : startSurah.numberOfAyahs;
    const startAyahVal = Math.max(1, Math.min(fromAyah, startSurah.numberOfAyahs));
    const validEndAyah = Math.max(1, Math.min(endAyahVal, startSurah.numberOfAyahs));

    // If reciting the entire surah (or ayah bounds cover full surah)
    if (startAyahVal <= 1 && validEndAyah >= startSurah.numberOfAyahs) {
      return startSurah.standardPages;
    }

    // Proportional fraction of the Surah's standard pages
    const recitedAyahs = Math.max(1, validEndAyah - startAyahVal + 1);
    const fraction = recitedAyahs / startSurah.numberOfAyahs;
    const computed = fraction * startSurah.standardPages;

    // Round to 1 decimal or quarter page
    return Number(Math.max(0.1, computed).toFixed(1));
  }

  // Case 2: Range across multiple Surahs (e.g. Surah A to Surah B)
  const minId = Math.min(startSurah.id, endSurah.id);
  const maxId = Math.max(startSurah.id, endSurah.id);

  let total = 0;
  for (let i = minId; i <= maxId; i++) {
    const s = SURAH_METADATA.find((item) => item.id === i);
    if (!s) continue;

    if (i === startSurah.id && fromAyah > 1) {
      // Partial start surah
      const remainingAyahs = Math.max(1, s.numberOfAyahs - fromAyah + 1);
      total += (remainingAyahs / s.numberOfAyahs) * s.standardPages;
    } else if (i === endSurah.id && typeof toAyah === "number" && toAyah < s.numberOfAyahs) {
      // Partial end surah
      const recitedAyahs = Math.max(1, toAyah);
      total += (recitedAyahs / s.numberOfAyahs) * s.standardPages;
    } else {
      // Full intermediate or boundary surah
      total += s.standardPages;
    }
  }

  return Number(Math.max(0.1, total).toFixed(1));
}

/**
 * Return verified total standard pages of Juz 30 (23.0)
 */
export function getJuz30TotalPages(): number {
  return Number(
    SURAH_METADATA.slice(77)
      .reduce((sum, s) => sum + s.standardPages, 0)
      .toFixed(1)
  );
}
