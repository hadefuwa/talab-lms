"use client";

import { useState } from "react";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/lib/types";

interface Props {
  quiz: Quiz;
  questions: QuizQuestion[];
  previousBest: QuizAttempt | null;
}

type Phase = "intro" | "playing" | "result";

export default function QuizPlayer({ quiz, questions, previousBest }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitQuiz() {
    setSubmitting(true);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz.id, answers: selected }),
    });
    const data = await res.json();
    setResult(data.attempt);
    setPhase("result");
    setSubmitting(false);
  }

  function pickAnswer(idx: number) {
    const next = [...selected];
    next[current] = idx;
    setSelected(next);
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  // ── Intro ──────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-400 mt-2">{quiz.description}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500">Questions</p>
            <p className="text-white font-bold text-xl mt-1">{questions.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500">Pass mark</p>
            <p className="text-white font-bold text-xl mt-1">{quiz.pass_score}%</p>
          </div>
        </div>
        {previousBest && (
          <div className={`rounded-xl px-4 py-3 border text-sm ${
            previousBest.passed
              ? "bg-green-900/20 border-green-800 text-green-400"
              : "bg-gray-800 border-gray-700 text-gray-400"
          }`}>
            Best attempt: {previousBest.score}/{previousBest.max_score} ({Math.round((previousBest.score / previousBest.max_score) * 100)}%)
            {previousBest.passed ? " — Passed ✓" : " — Not passed yet"}
          </div>
        )}
        {questions.length === 0 ? (
          <p className="text-yellow-500 text-sm">No questions added yet.</p>
        ) : (
          <button
            onClick={() => setPhase("playing")}
            className="w-full py-3 bg-talab-600 hover:bg-talab-700 text-white font-semibold rounded-xl transition-colors"
          >
            {previousBest ? "Retake Quiz" : "Start Quiz"}
          </button>
        )}
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────
  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.max_score) * 100);
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6 text-center">
        <div className="text-6xl">{result.passed ? "🎉" : "📚"}</div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {result.passed ? "You passed!" : "Keep practising"}
          </h2>
          <p className="text-gray-400 mt-1">
            {result.score} out of {result.max_score} correct
          </p>
        </div>
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={result.passed ? "#22c55e" : "#0ea5e9"}
              strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{pct}%</span>
          </div>
        </div>

        {/* Answer review */}
        <div className="text-left space-y-3 mt-4">
          {questions.map((q, idx) => {
            const userAnswer = (result.answers as number[])[idx];
            const correct = userAnswer === q.correct_index;
            return (
              <div key={q.id} className={`rounded-xl p-4 border text-sm ${correct ? "bg-green-900/10 border-green-900" : "bg-red-900/10 border-red-900"}`}>
                <p className="text-white font-medium mb-2">{idx + 1}. {q.question}</p>
                <p className={correct ? "text-green-400" : "text-red-400"}>
                  {correct ? "✓" : "✗"} {q.options[userAnswer] ?? "No answer"}
                </p>
                {!correct && (
                  <p className="text-gray-400 mt-1">Correct: {q.options[q.correct_index]}</p>
                )}
                {q.explanation && (
                  <p className="text-gray-500 mt-1 italic">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setPhase("intro");
            setCurrent(0);
            setSelected(Array(questions.length).fill(null));
            setResult(null);
          }}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
        >
          Back to Quiz
        </button>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-talab-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white leading-relaxed">{q.question}</h2>
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => pickAnswer(idx)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                selected[current] === idx
                  ? "bg-talab-600/20 border-talab-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-700"
              }`}
            >
              <span className="font-medium text-gray-500 mr-2">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded-xl transition-colors"
        >
          ← Back
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            disabled={selected[current] === null}
            className="flex-1 py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={selected.some((s) => s === null) || submitting}
            className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        )}
      </div>
      {selected.some((s) => s === null) && current === questions.length - 1 && (
        <p className="text-xs text-yellow-500 text-center">
          Answer all questions before submitting.
        </p>
      )}
    </div>
  );
}
