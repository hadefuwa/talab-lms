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
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resumeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices();
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      if (resumeRef.current) {
        clearInterval(resumeRef.current);
        resumeRef.current = null;
      }
    };
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (!resumeRef.current) return;
    clearInterval(resumeRef.current);
    resumeRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    clearResumeTimer();
    setSpeaking(false);
  }, [clearResumeTimer]);

  const speak = useCallback(() => {
    if (!supported || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const content = text.trim();
    if (!content) return;

    if (speaking) {
      stop();
      return;
    }

    clearResumeTimer();

    const synth = window.speechSynthesis;

    // Keep speak() in the trusted click handler. Android Chrome may ignore
    // speech started from a timer after cancel(), because user activation is gone.
    if (synth.speaking || synth.pending) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.lang = "en-GB";

    if (voicesRef.current.length === 0) {
      voicesRef.current = synth.getVoices();
    }

    const preferred =
      voicesRef.current.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")) ??
      voicesRef.current.find((v) => v.lang === "en-GB") ??
      voicesRef.current.find((v) => v.lang.startsWith("en-US")) ??
      voicesRef.current.find((v) => v.lang.startsWith("en"));

    if (preferred) {
      utterance.voice = preferred;
      utterance.lang = preferred.lang;
    }

    const finish = () => {
      utteranceRef.current = null;
      clearResumeTimer();
      setSpeaking(false);
    };

    utterance.onend = finish;
    utterance.onerror = (e) => {
      if (e.error !== "interrupted") finish();
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);

    // Android Chrome is not reliable about firing onstart.
    setSpeaking(true);
    resumeRef.current = setInterval(() => {
      if (synth.paused) synth.resume();
    }, 5000);
  }, [clearResumeTimer, speaking, stop, supported, text]);

  if (!supported) return null;

  if (size === "lg") {
    return (
      <button
        type="button"
        onClick={speak}
        aria-pressed={speaking}
        className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm transition-all select-none touch-manipulation ${
          speaking
            ? "bg-red-50 border-2 border-red-200 text-red-600"
            : "bg-talab-50 border-2 border-talab-200 text-talab-600 active:bg-talab-100"
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
      type="button"
      onClick={speak}
      aria-pressed={speaking}
      title={speaking ? "Stop" : "Read aloud"}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 select-none touch-manipulation ${
        speaking
          ? "bg-red-100 text-red-500"
          : "bg-slate-100 text-slate-400 hover:bg-talab-100 hover:text-talab-600 active:bg-talab-100 active:text-talab-600"
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
