export interface Surah {
  id: number;           // 1 to 114
  name: string;         // e.g. "الفاتحة", "البقرة"
  type: "مكية" | "مدنية";
  versesCount: number;  // total verses in surah
  startPage: number;    // start page in Madani Mushaf (1 to 604)
  endPage: number;      // end page in Madani Mushaf
  // Compatibility fields for existing code
  number: number;
  numberOfAyahs: number;
}

export type SurahItem = Surah;

export const SURAHS: Surah[] = [
  { id: 1, number: 1, name: "الفاتحة", type: "مكية", versesCount: 7, numberOfAyahs: 7, startPage: 1, endPage: 1 },
  { id: 2, number: 2, name: "البقرة", type: "مدنية", versesCount: 286, numberOfAyahs: 286, startPage: 2, endPage: 49 },
  { id: 3, number: 3, name: "آل عمران", type: "مدنية", versesCount: 200, numberOfAyahs: 200, startPage: 50, endPage: 76 },
  { id: 4, number: 4, name: "النساء", type: "مدنية", versesCount: 176, numberOfAyahs: 176, startPage: 77, endPage: 106 },
  { id: 5, number: 5, name: "المائدة", type: "مدنية", versesCount: 120, numberOfAyahs: 120, startPage: 106, endPage: 127 },
  { id: 6, number: 6, name: "الأنعام", type: "مكية", versesCount: 165, numberOfAyahs: 165, startPage: 128, endPage: 150 },
  { id: 7, number: 7, name: "الأعراف", type: "مكية", versesCount: 206, numberOfAyahs: 206, startPage: 151, endPage: 176 },
  { id: 8, number: 8, name: "الأنفال", type: "مدنية", versesCount: 75, numberOfAyahs: 75, startPage: 177, endPage: 186 },
  { id: 9, number: 9, name: "التوبة", type: "مدنية", versesCount: 129, numberOfAyahs: 129, startPage: 187, endPage: 207 },
  { id: 10, number: 10, name: "يونس", type: "مكية", versesCount: 109, numberOfAyahs: 109, startPage: 208, endPage: 221 },
  { id: 11, number: 11, name: "هود", type: "مكية", versesCount: 123, numberOfAyahs: 123, startPage: 221, endPage: 235 },
  { id: 12, number: 12, name: "يوسف", type: "مكية", versesCount: 111, numberOfAyahs: 111, startPage: 235, endPage: 248 },
  { id: 13, number: 13, name: "الرعد", type: "مدنية", versesCount: 43, numberOfAyahs: 43, startPage: 249, endPage: 255 },
  { id: 14, number: 14, name: "إبراهيم", type: "مكية", versesCount: 52, numberOfAyahs: 52, startPage: 255, endPage: 261 },
  { id: 15, number: 15, name: "الحجر", type: "مكية", versesCount: 99, numberOfAyahs: 99, startPage: 262, endPage: 267 },
  { id: 16, number: 16, name: "النحل", type: "مكية", versesCount: 128, numberOfAyahs: 128, startPage: 267, endPage: 281 },
  { id: 17, number: 17, name: "الإسراء", type: "مكية", versesCount: 111, numberOfAyahs: 111, startPage: 282, endPage: 293 },
  { id: 18, number: 18, name: "الكهف", type: "مكية", versesCount: 110, numberOfAyahs: 110, startPage: 293, endPage: 304 },
  { id: 19, number: 19, name: "مريم", type: "مكية", versesCount: 98, numberOfAyahs: 98, startPage: 305, endPage: 312 },
  { id: 20, number: 20, name: "طه", type: "مكية", versesCount: 135, numberOfAyahs: 135, startPage: 312, endPage: 321 },
  { id: 21, number: 21, name: "الأنبياء", type: "مكية", versesCount: 112, numberOfAyahs: 112, startPage: 322, endPage: 331 },
  { id: 22, number: 22, name: "الحج", type: "مدنية", versesCount: 78, numberOfAyahs: 78, startPage: 332, endPage: 341 },
  { id: 23, number: 23, name: "المؤمنون", type: "مكية", versesCount: 118, numberOfAyahs: 118, startPage: 342, endPage: 349 },
  { id: 24, number: 24, name: "النور", type: "مدنية", versesCount: 64, numberOfAyahs: 64, startPage: 350, endPage: 359 },
  { id: 25, number: 25, name: "الفرقان", type: "مكية", versesCount: 77, numberOfAyahs: 77, startPage: 359, endPage: 366 },
  { id: 26, number: 26, name: "الشعراء", type: "مكية", versesCount: 227, numberOfAyahs: 227, startPage: 367, endPage: 376 },
  { id: 27, number: 27, name: "النمل", type: "مكية", versesCount: 93, numberOfAyahs: 93, startPage: 377, endPage: 385 },
  { id: 28, number: 28, name: "القصص", type: "مكية", versesCount: 88, numberOfAyahs: 88, startPage: 385, endPage: 396 },
  { id: 29, number: 29, name: "العنكبوت", type: "مكية", versesCount: 69, numberOfAyahs: 69, startPage: 396, endPage: 404 },
  { id: 30, number: 30, name: "الروم", type: "مكية", versesCount: 60, numberOfAyahs: 60, startPage: 404, endPage: 410 },
  { id: 31, number: 31, name: "لقمان", type: "مكية", versesCount: 34, numberOfAyahs: 34, startPage: 411, endPage: 414 },
  { id: 32, number: 32, name: "السجدة", type: "مكية", versesCount: 30, numberOfAyahs: 30, startPage: 415, endPage: 417 },
  { id: 33, number: 33, name: "الأحزاب", type: "مدنية", versesCount: 73, numberOfAyahs: 73, startPage: 418, endPage: 427 },
  { id: 34, number: 34, name: "سبأ", type: "مكية", versesCount: 54, numberOfAyahs: 54, startPage: 428, endPage: 434 },
  { id: 35, number: 35, name: "فاطر", type: "مكية", versesCount: 45, numberOfAyahs: 45, startPage: 434, endPage: 440 },
  { id: 36, number: 36, name: "يس", type: "مكية", versesCount: 83, numberOfAyahs: 83, startPage: 440, endPage: 445 },
  { id: 37, number: 37, name: "الصافات", type: "مكية", versesCount: 182, numberOfAyahs: 182, startPage: 445, endPage: 452 },
  { id: 38, number: 38, name: "ص", type: "مكية", versesCount: 88, numberOfAyahs: 88, startPage: 453, endPage: 458 },
  { id: 39, number: 39, name: "الزمر", type: "مكية", versesCount: 75, numberOfAyahs: 75, startPage: 458, endPage: 467 },
  { id: 40, number: 40, name: "غافر", type: "مكية", versesCount: 85, numberOfAyahs: 85, startPage: 467, endPage: 476 },
  { id: 41, number: 41, name: "فصلت", type: "مكية", versesCount: 54, numberOfAyahs: 54, startPage: 477, endPage: 482 },
  { id: 42, number: 42, name: "الشورى", type: "مكية", versesCount: 53, numberOfAyahs: 53, startPage: 483, endPage: 489 },
  { id: 43, number: 43, name: "الزخرف", type: "مكية", versesCount: 89, numberOfAyahs: 89, startPage: 489, endPage: 495 },
  { id: 44, number: 44, name: "الدخان", type: "مكية", versesCount: 59, numberOfAyahs: 59, startPage: 496, endPage: 498 },
  { id: 45, number: 45, name: "الجاثية", type: "مكية", versesCount: 37, numberOfAyahs: 37, startPage: 499, endPage: 502 },
  { id: 46, number: 46, name: "الأحقاف", type: "مكية", versesCount: 35, numberOfAyahs: 35, startPage: 502, endPage: 506 },
  { id: 47, number: 47, name: "محمد", type: "مدنية", versesCount: 38, numberOfAyahs: 38, startPage: 507, endPage: 510 },
  { id: 48, number: 48, name: "الفتح", type: "مدنية", versesCount: 29, numberOfAyahs: 29, startPage: 511, endPage: 515 },
  { id: 49, number: 49, name: "الحجرات", type: "مدنية", versesCount: 18, numberOfAyahs: 18, startPage: 515, endPage: 517 },
  { id: 50, number: 50, name: "ق", type: "مكية", versesCount: 45, numberOfAyahs: 45, startPage: 518, endPage: 520 },
  { id: 51, number: 51, name: "الذاريات", type: "مكية", versesCount: 60, numberOfAyahs: 60, startPage: 520, endPage: 523 },
  { id: 52, number: 52, name: "الطور", type: "مكية", versesCount: 49, numberOfAyahs: 49, startPage: 523, endPage: 525 },
  { id: 53, number: 53, name: "النجم", type: "مكية", versesCount: 62, numberOfAyahs: 62, startPage: 526, endPage: 528 },
  { id: 54, number: 54, name: "القمر", type: "مكية", versesCount: 55, numberOfAyahs: 55, startPage: 528, endPage: 531 },
  { id: 55, number: 55, name: "الرحمن", type: "مدنية", versesCount: 78, numberOfAyahs: 78, startPage: 531, endPage: 534 },
  { id: 56, number: 56, name: "الواقعة", type: "مكية", versesCount: 96, numberOfAyahs: 96, startPage: 534, endPage: 537 },
  { id: 57, number: 57, name: "الحديد", type: "مدنية", versesCount: 29, numberOfAyahs: 29, startPage: 537, endPage: 541 },
  { id: 58, number: 58, name: "المجادلة", type: "مدنية", versesCount: 22, numberOfAyahs: 22, startPage: 542, endPage: 545 },
  { id: 59, number: 59, name: "الحشر", type: "مدنية", versesCount: 24, numberOfAyahs: 24, startPage: 545, endPage: 548 },
  { id: 60, number: 60, name: "الممتحنة", type: "مدنية", versesCount: 13, numberOfAyahs: 13, startPage: 549, endPage: 551 },
  { id: 61, number: 61, name: "الصف", type: "مدنية", versesCount: 14, numberOfAyahs: 14, startPage: 551, endPage: 553 },
  { id: 62, number: 62, name: "الجمعة", type: "مدنية", versesCount: 11, numberOfAyahs: 11, startPage: 553, endPage: 554 },
  { id: 63, number: 63, name: "المنافقون", type: "مدنية", versesCount: 11, numberOfAyahs: 11, startPage: 554, endPage: 556 },
  { id: 64, number: 64, name: "التغابن", type: "مدنية", versesCount: 18, numberOfAyahs: 18, startPage: 556, endPage: 558 },
  { id: 65, number: 65, name: "الطلاق", type: "مدنية", versesCount: 12, numberOfAyahs: 12, startPage: 558, endPage: 560 },
  { id: 66, number: 66, name: "التحريم", type: "مدنية", versesCount: 12, numberOfAyahs: 12, startPage: 560, endPage: 562 },
  { id: 67, number: 67, name: "الملك", type: "مكية", versesCount: 30, numberOfAyahs: 30, startPage: 562, endPage: 564 },
  { id: 68, number: 68, name: "القلم", type: "مكية", versesCount: 52, numberOfAyahs: 52, startPage: 564, endPage: 566 },
  { id: 69, number: 69, name: "الحاقة", type: "مكية", versesCount: 52, numberOfAyahs: 52, startPage: 566, endPage: 568 },
  { id: 70, number: 70, name: "المعارج", type: "مكية", versesCount: 44, numberOfAyahs: 44, startPage: 568, endPage: 570 },
  { id: 71, number: 71, name: "نوح", type: "مكية", versesCount: 28, numberOfAyahs: 28, startPage: 570, endPage: 571 },
  { id: 72, number: 72, name: "الجن", type: "مكية", versesCount: 28, numberOfAyahs: 28, startPage: 572, endPage: 573 },
  { id: 73, number: 73, name: "المزمل", type: "مكية", versesCount: 20, numberOfAyahs: 20, startPage: 574, endPage: 575 },
  { id: 74, number: 74, name: "المدثر", type: "مكية", versesCount: 56, numberOfAyahs: 56, startPage: 575, endPage: 577 },
  { id: 75, number: 75, name: "القيامة", type: "مكية", versesCount: 40, numberOfAyahs: 40, startPage: 577, endPage: 578 },
  { id: 76, number: 76, name: "الإنسان", type: "مدنية", versesCount: 31, numberOfAyahs: 31, startPage: 578, endPage: 580 },
  { id: 77, number: 77, name: "المرسلات", type: "مكية", versesCount: 50, numberOfAyahs: 50, startPage: 580, endPage: 581 },
  { id: 78, number: 78, name: "النبأ", type: "مكية", versesCount: 40, numberOfAyahs: 40, startPage: 582, endPage: 583 },
  { id: 79, number: 79, name: "النازعات", type: "مكية", versesCount: 46, numberOfAyahs: 46, startPage: 583, endPage: 584 },
  { id: 80, number: 80, name: "عبس", type: "مكية", versesCount: 42, numberOfAyahs: 42, startPage: 585, endPage: 585 },
  { id: 81, number: 81, name: "التكوير", type: "مكية", versesCount: 29, numberOfAyahs: 29, startPage: 586, endPage: 586 },
  { id: 82, number: 82, name: "الانفطار", type: "مكية", versesCount: 19, numberOfAyahs: 19, startPage: 587, endPage: 587 },
  { id: 83, number: 83, name: "المطففين", type: "مكية", versesCount: 36, numberOfAyahs: 36, startPage: 587, endPage: 589 },
  { id: 84, number: 84, name: "الانشقاق", type: "مكية", versesCount: 25, numberOfAyahs: 25, startPage: 589, endPage: 590 },
  { id: 85, number: 85, name: "البروج", type: "مكية", versesCount: 22, numberOfAyahs: 22, startPage: 590, endPage: 590 },
  { id: 86, number: 86, name: "الطارق", type: "مكية", versesCount: 17, numberOfAyahs: 17, startPage: 591, endPage: 591 },
  { id: 87, number: 87, name: "الأعلى", type: "مكية", versesCount: 19, numberOfAyahs: 19, startPage: 591, endPage: 592 },
  { id: 88, number: 88, name: "الغاشية", type: "مكية", versesCount: 26, numberOfAyahs: 26, startPage: 592, endPage: 593 },
  { id: 89, number: 89, name: "الفجر", type: "مكية", versesCount: 30, numberOfAyahs: 30, startPage: 593, endPage: 594 },
  { id: 90, number: 90, name: "البلد", type: "مكية", versesCount: 20, numberOfAyahs: 20, startPage: 594, endPage: 595 },
  { id: 91, number: 91, name: "الشمس", type: "مكية", versesCount: 15, numberOfAyahs: 15, startPage: 595, endPage: 595 },
  { id: 92, number: 92, name: "الليل", type: "مكية", versesCount: 21, numberOfAyahs: 21, startPage: 595, endPage: 596 },
  { id: 93, number: 93, name: "الضحى", type: "مكية", versesCount: 11, numberOfAyahs: 11, startPage: 596, endPage: 596 },
  { id: 94, number: 94, name: "الشرح", type: "مكية", versesCount: 8, numberOfAyahs: 8, startPage: 596, endPage: 596 },
  { id: 95, number: 95, name: "التين", type: "مكية", versesCount: 8, numberOfAyahs: 8, startPage: 597, endPage: 597 },
  { id: 96, number: 96, name: "العلق", type: "مكية", versesCount: 19, numberOfAyahs: 19, startPage: 597, endPage: 597 },
  { id: 97, number: 97, name: "القدر", type: "مكية", versesCount: 5, numberOfAyahs: 5, startPage: 598, endPage: 598 },
  { id: 98, number: 98, name: "البينة", type: "مدنية", versesCount: 8, numberOfAyahs: 8, startPage: 598, endPage: 599 },
  { id: 99, number: 99, name: "الزلزلة", type: "مدنية", versesCount: 8, numberOfAyahs: 8, startPage: 599, endPage: 599 },
  { id: 100, number: 100, name: "العاديات", type: "مكية", versesCount: 11, numberOfAyahs: 11, startPage: 599, endPage: 600 },
  { id: 101, number: 101, name: "القارعة", type: "مكية", versesCount: 11, numberOfAyahs: 11, startPage: 600, endPage: 600 },
  { id: 102, number: 102, name: "التكاثر", type: "مكية", versesCount: 8, numberOfAyahs: 8, startPage: 600, endPage: 600 },
  { id: 103, number: 103, name: "العصر", type: "مكية", versesCount: 3, numberOfAyahs: 3, startPage: 601, endPage: 601 },
  { id: 104, number: 104, name: "الهمزة", type: "مكية", versesCount: 9, numberOfAyahs: 9, startPage: 601, endPage: 601 },
  { id: 105, number: 105, name: "الفيل", type: "مكية", versesCount: 5, numberOfAyahs: 5, startPage: 601, endPage: 601 },
  { id: 106, number: 106, name: "قريش", type: "مكية", versesCount: 4, numberOfAyahs: 4, startPage: 602, endPage: 602 },
  { id: 107, number: 107, name: "الماعون", type: "مكية", versesCount: 7, numberOfAyahs: 7, startPage: 602, endPage: 602 },
  { id: 108, number: 108, name: "الكوثر", type: "مكية", versesCount: 3, numberOfAyahs: 3, startPage: 602, endPage: 602 },
  { id: 109, number: 109, name: "الكافرون", type: "مكية", versesCount: 6, numberOfAyahs: 6, startPage: 603, endPage: 603 },
  { id: 110, number: 110, name: "النصر", type: "مدنية", versesCount: 3, numberOfAyahs: 3, startPage: 603, endPage: 603 },
  { id: 111, number: 111, name: "المسد", type: "مكية", versesCount: 5, numberOfAyahs: 5, startPage: 603, endPage: 603 },
  { id: 112, number: 112, name: "الإخلاص", type: "مكية", versesCount: 4, numberOfAyahs: 4, startPage: 604, endPage: 604 },
  { id: 113, number: 113, name: "الفلق", type: "مكية", versesCount: 5, numberOfAyahs: 5, startPage: 604, endPage: 604 },
  { id: 114, number: 114, name: "الناس", type: "مكية", versesCount: 6, numberOfAyahs: 6, startPage: 604, endPage: 604 },
];

export const QURAN_SURAHS: Surah[] = SURAHS;

export function getSurahById(id: number): Surah | undefined {
  return SURAHS.find((s) => s.id === id);
}

export function getSurahByNumber(number: number): Surah | undefined {
  return SURAHS.find((s) => s.id === number);
}

export function getSurahByName(name: string): Surah | undefined {
  return SURAHS.find((s) => s.name === name);
}

export function getSurahByPage(page: number): Surah {
  const surah = SURAHS.find((s) => page >= s.startPage && page <= s.endPage);
  return surah || SURAHS[0];
}

export interface Juz {
  number: number;
  name: string;
  startPage: number;
}

export const QURAN_AJZAA: Juz[] = [
  { number: 1, name: "الجزء الأول (آلم - الفاتحة/البقرة)", startPage: 1 },
  { number: 2, name: "الجزء الثاني (سيقول السفهاء)", startPage: 22 },
  { number: 3, name: "الجزء الثالث (تلك الرسل)", startPage: 42 },
  { number: 4, name: "الجزء الرابع (لن تنالوا البر)", startPage: 62 },
  { number: 5, name: "الجزء الخامس (والمحصنات)", startPage: 82 },
  { number: 6, name: "الجزء السادس (لا يحب الله)", startPage: 102 },
  { number: 7, name: "الجزء السابع (وإذا سمعوا)", startPage: 122 },
  { number: 8, name: "الجزء الثامن (ولو أننا نزلنا)", startPage: 142 },
  { number: 9, name: "الجزء التاسع (قال الملأ)", startPage: 162 },
  { number: 10, name: "الجزء العاشر (واعلموا أنما)", startPage: 182 },
  { number: 11, name: "الجزء الحادي عشر (يعتذرون إليكم)", startPage: 202 },
  { number: 12, name: "الجزء الثاني عشر (وما من دابة)", startPage: 222 },
  { number: 13, name: "الجزء الثالث عشر (وما أبرئ نفسي)", startPage: 242 },
  { number: 14, name: "الجزء الرابع عشر (ربما يود)", startPage: 262 },
  { number: 15, name: "الجزء الخامس عشر (سبحان الذي)", startPage: 282 },
  { number: 16, name: "الجزء السادس عشر (قال ألم أقل لك)", startPage: 302 },
  { number: 17, name: "الجزء السابع عشر (اقترب للناس)", startPage: 322 },
  { number: 18, name: "الجزء الثامن عشر (قد أفلح المؤمنون)", startPage: 342 },
  { number: 19, name: "الجزء التاسع عشر (وقال الذين لا يرجون)", startPage: 362 },
  { number: 20, name: "الجزء العشرون (فما كان جواب قومه)", startPage: 382 },
  { number: 21, name: "الجزء الحادي والعشرون (ولا تجادلوا)", startPage: 402 },
  { number: 22, name: "الجزء الثاني والعشرون (ومن يقنت)", startPage: 422 },
  { number: 23, name: "الجزء الثالث والعشرون (وما أنزلنا)", startPage: 442 },
  { number: 24, name: "الجزء الرابع والعشرون (فمن أظلم)", startPage: 462 },
  { number: 25, name: "الجزء الخامس والعشرون (إليه يرد)", startPage: 482 },
  { number: 26, name: "الجزء السادس والعشرون (حـم - الأحقاف)", startPage: 502 },
  { number: 27, name: "الجزء السابع والعشرون (قال فما خطبكم)", startPage: 522 },
  { number: 28, name: "الجزء الثامن والعشرون (قد سمع الله)", startPage: 542 },
  { number: 29, name: "الجزء التاسع والعشرون (تبارك الذي)", startPage: 562 },
  { number: 30, name: "الجزء الثلاثون (عمّ يتساءلون)", startPage: 582 },
];

export function getJuzByPage(page: number): Juz {
  for (let i = QURAN_AJZAA.length - 1; i >= 0; i--) {
    if (page >= QURAN_AJZAA[i].startPage) {
      return QURAN_AJZAA[i];
    }
  }
  return QURAN_AJZAA[0];
}

