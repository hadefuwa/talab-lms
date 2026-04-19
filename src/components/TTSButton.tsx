"use client";

import { useEffect, useState, useCallback } from "react";

interface Props {
  text: string;
  autoPlay?: boolean;
  size?: "sm" | "lg";
  label?: string;
}

export default function TTSButton({ text, autoPlay = false, size = "sm", label }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.lang = "en-GB";
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [text, supported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // Auto-play when text changes (e.g. new quiz question)
  useEffect(() => {
    if (!autoPlay || !supported) return;
    const t = setTimeout(speak, 400);
    return () => {
      clearTimeout(t);
      window.speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, [text, autoPlay, supported, speak]);

  // Stop on unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  if (!supported) return null;

  if (size === "lg") {
    return (
      <button
        onClick={speaking ? stop : speak}
        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all ${
          speaking
            ? "bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100"
            : "bg-talab-50 border-2 border-talab-200 text-talab-600 hover:bg-talab-100"
        }`}
      >
        {speaking ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            Stop reading
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9.5 9.5a3 3 0 000 5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v8a1 1 0 001 1h1l4 3V4L7 7H6a1 1 0 00-1 1z" />
            </svg>
            {label ?? "Read to me"}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={speaking ? stop : speak}
      title={speaking ? "Stop" : "Read aloud"}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
        speaking
          ? "bg-red-100 text-red-500 hover:bg-red-200"
          : "bg-slate-100 text-slate-400 hover:bg-talab-100 hover:text-talab-600"
      }`}
    >
      {speaking ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M9.5 9.5a3 3 0 000 5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v8a1 1 0 001 1h1l4 3V4L7 7H6a1 1 0 00-1 1z" />
        </svg>
      )}
    </button>
  );
}
