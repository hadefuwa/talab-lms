"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Props {
  text: string;
  size?: "sm" | "lg";
  label?: string;
}

export default function TTSButton({ text, size = "sm", label }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const resumeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      window.speechSynthesis?.cancel();
      if (resumeRef.current) clearInterval(resumeRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    if (resumeRef.current) { clearInterval(resumeRef.current); resumeRef.current = null; }
    setSpeaking(false);
  }, []);

  function getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) { resolve(voices); return; }
      // Android/Chrome loads voices async
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      // Fallback if event never fires
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
    });
  }

  const speak = useCallback(async () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    if (resumeRef.current) { clearInterval(resumeRef.current); resumeRef.current = null; }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.lang = "en-GB";

    // Wait for voices to load (critical on Android)
    const voices = await getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Daniel"))
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      setSpeaking(true);
      // iOS pauses synthesis after ~15s — keep it alive
      resumeRef.current = setInterval(() => {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      }, 5000);
    };
    utterance.onend = () => { stop(); };
    utterance.onerror = () => { stop(); };

    window.speechSynthesis.speak(utterance);
  }, [text, supported, stop]);

  if (!supported) return null;

  if (size === "lg") {
    return (
      <button
        onClick={speaking ? stop : speak}
        className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm transition-all select-none ${
          speaking
            ? "bg-red-50 border-2 border-red-200 text-red-600 active:bg-red-100"
            : "bg-talab-50 border-2 border-talab-200 text-talab-600 active:bg-talab-100 hover:bg-talab-100"
        }`}
      >
        {speaking ? (
          <>
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            Stop reading
          </>
        ) : (
          <>
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v8a1 1 0 001 1h1l4 3V4L7 7H6a1 1 0 00-1 1z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728" />
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
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 select-none ${
        speaking
          ? "bg-red-100 text-red-500 active:bg-red-200"
          : "bg-slate-100 text-slate-400 hover:bg-talab-100 hover:text-talab-600 active:bg-talab-100"
      }`}
    >
      {speaking ? (
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
