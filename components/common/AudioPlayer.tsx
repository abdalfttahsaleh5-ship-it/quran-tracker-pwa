"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, RotateCcw } from "lucide-react";
import { lightHaptic } from "@/lib/haptics";

export interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export function AudioPlayer({ src, title = "تلاوة مسجلة", className = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    lightHaptic();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs max-w-full ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-sm shrink-0 transition-transform active:scale-95"
        title={isPlaying ? "إيقاف مؤقت" : "استماع للتلاوة"}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      {/* Time & Progress Info */}
      <div className="flex flex-col min-w-[120px] max-w-[180px] gap-1 flex-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900 dark:text-emerald-300">
          <span className="flex items-center gap-1 truncate">
            <Volume2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{title}</span>
          </span>
          <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Mini Range Bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-emerald-200 dark:bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-emerald-700 dark:accent-emerald-400"
        />
      </div>
    </div>
  );
}
