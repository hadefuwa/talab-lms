"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  size?: "sm" | "lg";
  label?: string;
}

type Status = "idle" | "playing" | "error";

function splitTextForSpeech(text: string) {
  const maxLength = 220;
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
  const runIdRef = useRef(0);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    utterancesRef.current = [];

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setStatus("idle");
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("error");
      return;
    }

    const chunks = splitTextForSpeech(text);
    if (chunks.length === 0) return;

    stop();

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const synth = window.speechSynthesis;
    const utterances = chunks.map((chunk) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.rate = 1;
      return utterance;
    });

    utterancesRef.current = utterances;
    setStatus("playing");

    utterances.forEach((utterance, index) => {
      utterance.onend = () => {
        if (runId !== runIdRef.current) return;

        if (index === utterances.length - 1) {
          utterancesRef.current = [];
          setStatus("idle");
        }
      };

      utterance.onerror = () => {
        if (runId !== runIdRef.current) return;

        utterancesRef.current = [];
        setStatus("error");
      };

      synth.speak(utterance);
    });
  }, [stop, text]);

  const active = status === "playing";
  const buttonLabel = active ? "Stop reading" : label ?? "Read to me";

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
