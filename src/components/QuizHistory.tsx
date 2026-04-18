"use client";

import { useState } from "react";
import type { Quiz, QuizAttempt } from "@/lib/types";

interface Props {
  attempts: QuizAttempt[];
  quiz: Quiz;
}

export default function QuizHistory({ attempts, quiz }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Attempt history ({attempts.length})
      </button>

      {open && (
        <div className="mt-3 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 px-5 py-2 text-xs text-gray-600 font-medium border-b border-gray-800">
            <span>#</span>
            <span>Score</span>
            <span>Result</span>
            <span>Date</span>
          </div>
          {attempts.map((attempt, i) => {
            const pct = Math.round((attempt.score / attempt.max_score) * 100);
            return (
              <div
                key={attempt.id}
                className="grid grid-cols-4 px-5 py-3 text-sm border-b border-gray-800/60 last:border-0 items-center"
              >
                <span className="text-gray-500">{attempts.length - i}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: attempt.passed ? "#22c55e" : "#0ea5e9",
                      }}
                    />
                  </div>
                  <span className="text-white font-medium">{pct}%</span>
                </div>
                <span className={attempt.passed ? "text-green-400" : "text-gray-500"}>
                  {attempt.passed ? "Passed ✓" : `Need ${quiz.pass_score}%`}
                </span>
                <span className="text-gray-600">
                  {new Date(attempt.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
