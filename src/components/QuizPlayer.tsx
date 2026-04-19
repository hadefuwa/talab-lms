"use client";

import { useState } from "react";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/lib/types";
import TTSButton from "@/components/TTSButton";

interface Props {
  quiz: Quiz;
  questions: QuizQuestion[];
  previousBest: QuizAttempt | null;
}

type Phase = "intro" | "playing" | "result";

export default function QuizPlayer({ quiz, questions, previousBest }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>(Array(questions.length).fill(null));
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

  // Build TTS text for current question including options
  const questionTTS = q
    ? `Question ${current + 1}. ${q.question}. ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(". ")}`
    : "";

  // ── Intro ──────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">{quiz.title}</h1>
            {quiz.description && <p className="text-slate-500 mt-2">{quiz.description}</p>}
          </div>
          <TTSButton text={`${quiz.title}. ${quiz.description ?? ""} This quiz has ${questions.length} questions. The pass mark is ${quiz.pass_score} percent.`} size="sm" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Questions</p>
            <p className="text-slate-800 font-black text-2xl mt-1">{questions.length}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Pass mark</p>
            <p className="text-slate-800 font-black text-2xl mt-1">{quiz.pass_score}%</p>
          </div>
        </div>
        {previousBest && (
          <div className={`rounded-xl px-4 py-3 border text-sm font-medium ${
            previousBest.passed
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            Best attempt: {previousBest.score}/{previousBest.max_score} ({Math.round((previousBest.score / previousBest.max_score) * 100)}%)
            {previousBest.passed ? " — Passed ✓" : " — Not passed yet"}
          </div>
        )}
        {questions.length === 0 ? (
          <p className="text-amber-600 text-sm">No questions added yet.</p>
        ) : (
          <button
            onClick={() => setPhase("playing")}
            className="w-full py-4 bg-talab-600 hover:bg-talab-700 text-white font-bold text-lg rounded-2xl transition-colors"
          >
            {previousBest ? "Retake Quiz" : "Start Quiz"} →
          </button>
        )}
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────
  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.max_score) * 100);
    const resultText = result.passed
      ? `Well done! You passed with ${pct} percent. You got ${result.score} out of ${result.max_score} correct.`
      : `You got ${result.score} out of ${result.max_score} correct. That is ${pct} percent. Keep practising and try again!`;

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-6 text-center">
        <div className="text-6xl">{result.passed ? "🎉" : "📚"}</div>
        <div className="flex items-center justify-center gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-800">
              {result.passed ? "You passed!" : "Keep practising"}
            </h2>
            <p className="text-slate-500 mt-1">{result.score} out of {result.max_score} correct</p>
          </div>
          <TTSButton text={resultText} size="sm" />
        </div>

        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={result.passed ? "#22c55e" : "#3b82f6"}
              strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-slate-800">{pct}%</span>
          </div>
        </div>

        {/* Answer review */}
        <div className="text-left space-y-3 mt-4">
          {questions.map((q, idx) => {
            const userAnswer = (result.answers as number[])[idx];
            const correct = userAnswer === q.correct_index;
            return (
              <div key={q.id} className={`rounded-xl p-4 border text-sm ${correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-800 font-semibold">{idx + 1}. {q.question}</p>
                  <TTSButton text={`${q.question}. ${correct ? "Correct!" : `You answered ${q.options[userAnswer] ?? "nothing"}. The correct answer is ${q.options[q.correct_index]}.`} ${q.explanation ?? ""}`} size="sm" />
                </div>
                <p className={`mt-2 font-medium ${correct ? "text-green-700" : "text-red-600"}`}>
                  {correct ? "✓" : "✗"} {q.options[userAnswer] ?? "No answer"}
                </p>
                {!correct && (
                  <p className="text-slate-500 mt-1">Correct: <span className="font-medium text-green-700">{q.options[q.correct_index]}</span></p>
                )}
                {q.explanation && (
                  <p className="text-slate-400 mt-1 italic text-xs">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => { setPhase("intro"); setCurrent(0); setSelected(Array(questions.length).fill(null)); setResult(null); }}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-colors"
        >
          Back to Quiz
        </button>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-talab-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-card space-y-5">
        {/* Question + TTS */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 leading-relaxed">{q.question}</h2>
          </div>
          <TTSButton text={questionTTS} size="lg" label="Read question" key={current} />
        </div>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => pickAnswer(idx)}
              className={`w-full text-left px-4 py-4 rounded-2xl border-2 text-sm font-medium transition-all ${
                selected[current] === idx
                  ? "bg-talab-50 border-talab-400 text-talab-800"
                  : "bg-slate-50 border-slate-100 text-slate-700 hover:border-talab-200 hover:bg-talab-50/50"
              }`}
            >
              <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold mr-3 ${
                selected[current] === idx ? "bg-talab-500 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {String.fromCharCode(65 + idx)}
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
          className="px-5 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-semibold rounded-2xl transition-colors"
        >
          ← Back
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            disabled={selected[current] === null}
            className="flex-1 py-3 bg-talab-600 hover:bg-talab-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={selected.some((s) => s === null) || submitting}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Quiz ✓"}
          </button>
        )}
      </div>
      {selected.some((s) => s === null) && current === questions.length - 1 && (
        <p className="text-xs text-amber-600 text-center font-medium">Answer all questions before submitting.</p>
      )}
    </div>
  );
}
