"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  List,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Sparkles,
  BookMarked,
} from "lucide-react";
import {
  SURAHS,
  QURAN_AJZAA,
  getSurahByPage,
  getJuzByPage,
  Surah,
  Juz,
} from "@/lib/constants/quran";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function QuranReaderPage() {
  // Mode: "index" (فهرس المصحف) or "reader" (قارئ الصفحات)
  const [viewMode, setViewMode] = useState<"index" | "reader">("index");
  // Current page number (1 to 604)
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Index sub-tab: "surahs" or "ajzaa"
  const [indexTab, setIndexTab] = useState<"surahs" | "ajzaa">("surahs");
  // Search filter query
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Image CDN fallback index per page
  const [cdnIndex, setCdnIndex] = useState<number>(0);
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // Touch swipe coordinates
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Helper to format page CDN URL
  const getPageImageUrl = useCallback((page: number, cdnIdx: number = 0): string => {
    const padded = String(page).padStart(3, "0");
    if (cdnIdx === 0) {
      return `https://quran.ksu.edu.sa/ayat/safahat1/${page}.png`;
    } else if (cdnIdx === 1) {
      return `https://cdn.islamic.network/quran/images/high-resolution/604_${page}.png`;
    } else {
      return `https://raw.githubusercontent.com/GlobalQuran/quran-images/master/images/604/${page}.png`;
    }
  }, []);

  // Preload adjacent pages in memory for 0ms instant page flips
  useEffect(() => {
    if (viewMode !== "reader") return;

    const pagesToPreload = [currentPage - 1, currentPage + 1].filter(
      (p) => p >= 1 && p <= 604
    );

    pagesToPreload.forEach((p) => {
      const img = new Image();
      img.src = getPageImageUrl(p, cdnIndex);
    });
  }, [currentPage, viewMode, cdnIndex, getPageImageUrl]);

  // Page navigation handlers
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < 604 ? prev + 1 : prev));
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  const jumpToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(604, page));
    setCurrentPage(clamped);
    setViewMode("reader");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyboard Navigation (Arrow Keys)
  useEffect(() => {
    if (viewMode !== "reader") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        // In Arabic RTL, left arrow goes to next page
        goToNextPage();
      } else if (e.key === "ArrowRight") {
        // Right arrow goes to prev page
        goToPrevPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, goToNextPage, goToPrevPage]);

  // Touch Swipe Handlers for Mobile Gesture Navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isMinSwipe = Math.abs(distance) > 40;

    if (isMinSwipe) {
      if (distance > 0) {
        // Swiped Left (finger moved right to left) -> Next Page
        goToNextPage();
      } else {
        // Swiped Right (finger moved left to right) -> Previous Page
        goToPrevPage();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Current metadata
  const currentSurah = getSurahByPage(currentPage);
  const currentJuz = getJuzByPage(currentPage);

  // Filtered lists for index
  const filteredSurahs = SURAHS.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.id.toString().includes(searchQuery) ||
      s.startPage.toString().includes(searchQuery)
  );

  const filteredAjzaa = QURAN_AJZAA.filter(
    (j) =>
      j.name.includes(searchQuery) ||
      j.number.toString().includes(searchQuery) ||
      j.startPage.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* Dynamic Header & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <span>المصحف الشريف</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-200">
                مصحف المدينة النبوية (604 صفحة)
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              قراءة تفاعلية عالية الدقة مع دعم اللمس والتنقل السريع بين السور والأجزاء
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={viewMode === "index" ? "default" : "outline"}
            onClick={() => setViewMode("index")}
            className="flex-1 sm:flex-initial gap-2 font-bold"
          >
            <List className="w-4 h-4" />
            <span>الفهرس</span>
          </Button>

          <Button
            variant={viewMode === "reader" ? "default" : "outline"}
            onClick={() => setViewMode("reader")}
            className="flex-1 sm:flex-initial gap-2 font-bold"
          >
            <BookMarked className="w-4 h-4" />
            <span>القارئ ({currentPage})</span>
          </Button>
        </div>
      </div>

      {/* VIEW MODE 1: INDEX (فهرس المصحف) */}
      {viewMode === "index" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sub-tabs & Search Input */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIndexTab("surahs")}
                className={`px-5 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                  indexTab === "surahs"
                    ? "bg-teal-800 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>فهرس السور (114)</span>
              </button>

              <button
                type="button"
                onClick={() => setIndexTab("ajzaa")}
                className={`px-5 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                  indexTab === "ajzaa"
                    ? "bg-teal-800 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>فهرس الأجزاء (30)</span>
              </button>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder={
                  indexTab === "surahs"
                    ? "ابحث باسم السورة أو رقم الصفحة..."
                    : "ابحث برقم الجزء..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 text-sm bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          {/* TAB 1: SURAHS GRID */}
          {indexTab === "surahs" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSurahs.map((surah: Surah) => (
                <Card
                  key={surah.id}
                  className="hover:border-teal-600 hover:shadow-md transition-all border-slate-200 dark:border-slate-800 group"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-900 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                        {surah.id}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>سورة {surah.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              surah.type === "مكية"
                                ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {surah.type}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          آياتها: {surah.versesCount} | الصفحة: {surah.startPage} - {surah.endPage}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => jumpToPage(surah.startPage)}
                      className="gap-1.5 font-bold shadow-sm"
                    >
                      <span>اقرأ</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* TAB 2: AJZAA GRID */}
          {indexTab === "ajzaa" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAjzaa.map((juz: Juz) => (
                <Card
                  key={juz.number}
                  className="hover:border-teal-600 hover:shadow-md transition-all border-slate-200 dark:border-slate-800 group"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-sm">
                        {juz.number}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {juz.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          يبدأ من صفحة: <strong className="text-teal-700 font-mono">{juz.startPage}</strong>
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => jumpToPage(juz.startPage)}
                      className="gap-1.5 font-bold border-teal-200 hover:bg-teal-50 hover:text-teal-900"
                    >
                      <span>انتقال</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: READER (قارئ الصفحات 1-604) */}
      {viewMode === "reader" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Top Control Bar inside Reader */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-teal-700">
            {/* Dynamic Status Display */}
            <div className="flex items-center gap-3 flex-wrap text-sm font-bold">
              <span className="bg-white/15 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>سورة {currentSurah.name} ({currentSurah.type})</span>
              </span>

              <span className="bg-white/15 px-3 py-1 rounded-lg border border-white/10">
                {currentJuz.name.split(" ")[0]} {currentJuz.name.split(" ")[1]}
              </span>

              <span className="bg-amber-400 text-teal-950 font-mono font-black px-3 py-1 rounded-lg shadow-sm">
                صفحة {currentPage} من 604
              </span>
            </div>

            {/* Controls: Surah Dropdown & Direct Page Jump */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Quick Surah Jump Dropdown */}
              <select
                value={currentSurah.id}
                onChange={(e) => {
                  const sId = Number(e.target.value);
                  const found = SURAHS.find((s) => s.id === sId);
                  if (found) jumpToPage(found.startPage);
                }}
                className="h-10 rounded-xl bg-white/10 text-white border border-white/20 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 max-w-[160px] cursor-pointer"
              >
                {SURAHS.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900 font-bold">
                    {s.id}. سورة {s.name} ({s.startPage})
                  </option>
                ))}
              </select>

              {/* Direct Page Input */}
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/20">
                <span className="text-xs font-bold text-teal-200">صفحة:</span>
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={currentPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= 604) setCurrentPage(val);
                  }}
                  className="w-14 h-8 text-center font-mono font-bold text-xs bg-white text-slate-900 rounded-lg outline-none"
                />
              </div>

              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white hover:bg-white/20 h-10 w-10 shrink-0"
                title={isFullscreen ? "إنهاء ملء الشاشة" : "عرض بملء الشاشة"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Quick Page Slider for Instant Scrubbing */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500">1</span>
            <input
              type="range"
              min={1}
              max={604}
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="flex-1 accent-teal-700 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-slate-500">604</span>
          </div>

          {/* HD MADANI QURAN PAGE VIEWER CONTAINER */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative bg-amber-50/50 dark:bg-slate-950 rounded-2xl border-2 border-amber-200/60 dark:border-slate-800 p-2 sm:p-4 shadow-2xl flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-300 min-h-[600px] ${
              isFullscreen ? "fixed inset-0 z-50 rounded-none bg-slate-950 p-2" : ""
            }`}
          >
            {/* Overlay Navigation Arrow Buttons */}
            <button
              onClick={goToNextPage}
              disabled={currentPage >= 604}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-teal-900/80 hover:bg-teal-900 text-white backdrop-blur-md flex items-center justify-center shadow-2xl transition-all disabled:opacity-30 disabled:pointer-events-none group"
              title="الصفحة التالية (التنقل لليسار)"
            >
              <ChevronLeft className="w-7 h-7 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-teal-900/80 hover:bg-teal-900 text-white backdrop-blur-md flex items-center justify-center shadow-2xl transition-all disabled:opacity-30 disabled:pointer-events-none group"
              title="الصفحة السابقة (التنقل لليمين)"
            >
              <ChevronRight className="w-7 h-7 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* High-Definition Madani Quran Page Image */}
            <div className="relative max-w-2xl w-full flex items-center justify-center my-auto transition-transform duration-200 ease-out">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={currentPage}
                src={getPageImageUrl(currentPage, cdnIndex)}
                alt={`المصحف الشريف صفحة ${currentPage}`}
                onError={() => {
                  if (cdnIndex < 2) {
                    setCdnIndex((prev) => prev + 1);
                  }
                }}
                className="max-h-[75vh] sm:max-h-[82vh] w-auto h-auto object-contain rounded-lg shadow-xl border border-amber-900/10 dark:border-slate-800 transition-opacity duration-200 animate-in fade-in duration-150"
              />
            </div>

            {/* Bottom Floating Navigation Indicator */}
            <div className="mt-3 flex items-center justify-between w-full max-w-2xl px-2 text-xs font-bold text-slate-500">
              <button
                onClick={goToNextPage}
                disabled={currentPage >= 604}
                className="hover:text-teal-700 disabled:opacity-30"
              >
                ← الصفحة التالية ({currentPage < 604 ? currentPage + 1 : 604})
              </button>

              <span className="font-mono text-slate-700 dark:text-slate-300">
                {currentPage} / 604
              </span>

              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="hover:text-teal-700 disabled:opacity-30"
              >
                الصفحة السابقة ({currentPage > 1 ? currentPage - 1 : 1}) →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
