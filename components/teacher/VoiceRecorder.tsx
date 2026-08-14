"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, Volume2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lightHaptic, successHaptic, warningHaptic } from "@/lib/haptics";

export interface VoiceRecorderProps {
  onAudioRecorded: (blob: Blob | null, durationSeconds: number) => void;
  maxDurationSeconds?: number;
  className?: string;
}

export function VoiceRecorder({
  onAudioRecorded,
  maxDurationSeconds = 60,
  className = "",
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  // Handle Playback Time Updates
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setPlaybackTime(Math.floor(audio.currentTime));
    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // Start Recording
  const startRecording = async () => {
    lightHaptic();
    setPermissionError(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("المتصفح لا يدعم تسجيل الصوت المباشر");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported mimeType
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const mime = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);
        onAudioRecorded(blob, duration);
        successHaptic();
      };

      mediaRecorder.start(250); // Collect in 250ms chunks
      setIsRecording(true);
      setDuration(0);

      // Duration counter
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      warningHaptic();
      setPermissionError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "يرجى منح إذن الوصول إلى الميكروفون لتسجيل التلاوة"
          : err.message || "تعذر بدء التسجيل الصوتي"
      );
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = useCallback(() => {
    lightHaptic();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Delete & Reset Recording
  const handleDeleteRecording = () => {
    lightHaptic();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setDuration(0);
    setPlaybackTime(0);
    onAudioRecorded(null, 0);
  };

  // Toggle Audio Playback
  const togglePlayAudio = () => {
    lightHaptic();
    if (!audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden Audio Element for Preview */}
      {audioUrl && (
        <audio ref={audioElementRef} src={audioUrl} preload="auto" className="hidden" />
      )}

      {/* Permission Error Box */}
      {permissionError && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Idle State: Start Recording Trigger */}
      {!isRecording && !audioBlob && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span>تسجيل تلاوة الطالب المتميزة 🎙️ (صوت)</span>
        </button>
      )}

      {/* Active Recording State */}
      {isRecording && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-black text-rose-800 dark:text-rose-200">
              جارٍ تسجيل التلاوة... ({formatSeconds(duration)} / {formatSeconds(maxDurationSeconds)})
            </span>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={stopRecording}
            className="rounded-xl h-8 px-3 gap-1.5 font-black text-xs shadow-md animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>إيقاف ⏹️</span>
          </Button>
        </div>
      )}

      {/* Stopped / Recorded Preview State */}
      {!isRecording && audioBlob && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-8 h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-90"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم تسجيل التلاوة بنجاح ✨</span>
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-mono font-bold">
                {isPlaying ? formatSeconds(playbackTime) : "0:00"} / {formatSeconds(duration)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteRecording}
            title="حذف وإعادة التسجيل"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-xl h-8 px-2 text-xs font-bold gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة</span>
          </Button>
        </div>
      )}
    </div>
  );
}
