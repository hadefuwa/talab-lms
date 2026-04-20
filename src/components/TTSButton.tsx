"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  text: string;
  size?: "sm" | "lg";
  label?: string;
}

type Status = "idle" | "loading" | "playing" | "error";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQQAAAAAAA==";

function splitTextForAudio(text: string) {
  const maxLength = 900;
  const normalized = text.replace(/\s+/g, " ").trim();
  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [normalized];
  const chunks: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLength) {
      chunks.push(trimmed);
      continue;
    }

    let current = "";
    for (const word of trimmed.split(" ")) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxLength && current) {
        chunks.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}

export default function TTSButton({ text, size = "sm", label }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const runIdRef = useRef(0);

  const clearObjectUrls = useCallback(() => {
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    objectUrlsRef.current = [];
  }, []);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    clearObjectUrls();
    setStatus("idle");
  }, [clearObjectUrls]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }

      clearObjectUrls();
    };
  }, [clearObjectUrls]);

  const playAudioBlob = useCallback(async (blob: Blob, runId: number) => {
    if (runId !== runIdRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.push(url);
    audio.src = url;
    audio.muted = false;
    audio.currentTime = 0;

    await audio.play();
  }, []);

  const play = useCallback(async () => {
    const chunks = splitTextForAudio(text);
    if (chunks.length === 0) return;

    stop();
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    const audio = new Audio(SILENT_WAV);
    audio.preload = "auto";
    audioRef.current = audio;

    // Start an audio element during the user gesture so Android allows later playback.
    audio.muted = true;
    void audio.play().catch(() => undefined);

    const abort = new AbortController();
    abortRef.current = abort;
    setStatus("loading");

    try {
      for (const chunk of chunks) {
        if (runId !== runIdRef.current) return;

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk }),
          signal: abort.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "TTS request failed" }));
          throw new Error(error.error ?? "TTS request failed");
        }

        const blob = await response.blob();
        if (runId !== runIdRef.current) return;

        setStatus("playing");
        await playAudioBlob(blob, runId);

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Audio playback failed"));
        });
      }

      if (runId === runIdRef.current) {
        clearObjectUrls();
        setStatus("idle");
      }
    } catch (error) {
      if (abort.signal.aborted || runId !== runIdRef.current) return;
      console.error(error);
      clearObjectUrls();
      setStatus("error");
    } finally {
      if (runId === runIdRef.current) {
        abortRef.current = null;
      }
    }
  }, [clearObjectUrls, playAudioBlob, stop, text]);

  const active = status === "loading" || status === "playing";
  const buttonLabel = status === "loading" ? "Preparing audio..." : active ? "Stop reading" : label ?? "Read to me";

  if (size === "lg") {
    return (
      <button
        type="button"
        onClick={active ? stop : play}
        aria-pressed={active}
        className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm transition-all select-none touch-manipulation ${
          active
            ? "bg-red-50 border-2 border-red-200 text-red-600"
            : status === "error"
              ? "bg-amber-50 border-2 border-amber-200 text-amber-700"
              : "bg-talab-50 border-2 border-talab-200 text-talab-600 active:bg-talab-100"
        }`}
      >
        {active ? (
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v8a1 1 0 001 1h1l4 3V4L7 7H6a1 1 0 00-1 1z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728" />
          </svg>
        )}
        {buttonLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={active ? stop : play}
      aria-pressed={active}
      title={active ? "Stop" : status === "error" ? "Audio failed. Try again." : "Read aloud"}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 select-none touch-manipulation ${
        active
          ? "bg-red-100 text-red-500"
          : status === "error"
            ? "bg-amber-100 text-amber-600"
            : "bg-slate-100 text-slate-400 hover:bg-talab-100 hover:text-talab-600 active:bg-talab-100 active:text-talab-600"
      }`}
    >
      {active ? (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v8a1 1 0 001 1h1l4 3V4L7 7H6a1 1 0 00-1 1z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
        </svg>
      )}
    </button>
  );
}
