"use client";

import { useEffect, useRef, useState } from "react";
import type { Lesson, ProgressLog } from "@/lib/types";

// ─── Block type definitions ───────────────────────────────────────────────────

type ExplanationBlock = {
  type: "explanation";
  emoji?: string;
  title: string;
  body: string;
};

type WorkedExampleBlock = {
  type: "worked_example";
  title: string;
  steps: string[];
};

type MultipleChoiceBlock = {
  type: "multiple_choice";
  question: string;
  options: string[];
  correct: number;
  hint?: string;
};

type CountingGameBlock = {
  type: "counting_game";
  prompt: string;
  item: string;
  count: number;
  success?: string;
};

type FillBlankBlock = {
  type: "fill_blank";
  question: string;
  template: string;
  answer: string;
  hint?: string;
};

type CelebrationBlock = {
  type: "celebration";
  message: string;
};

type Block =
  | ExplanationBlock
  | WorkedExampleBlock
  | MultipleChoiceBlock
  | CountingGameBlock
  | FillBlankBlock
  | CelebrationBlock;

type LessonData = {
  version: number;
  xp_reward?: number;
  blocks: Block[];
};

// ─── Per-block state ──────────────────────────────────────────────────────────

type BlockState = {
  answered: boolean;
  correct: boolean;
  attempts: number;
  revealed: boolean; // answer was shown to user
  xpEarned: number;
};

const defaultBlockState = (): BlockState => ({
  answered: false,
  correct: false,
  attempts: 0,
  revealed: false,
  xpEarned: 0,
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  lesson: Lesson;
  orgId: string;
  existingProgress: ProgressLog | null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InteractiveLessonPlayer({ lesson, orgId, existingProgress }: Props) {
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blockStates, setBlockStates] = useState<BlockState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const alreadyCompleted = existingProgress?.status === "completed";

  useEffect(() => {
    async function load() {
      let data: LessonData | null = null;
      if (lesson.content_path) {
        try {
          const res = await fetch(`/lessons/${lesson.content_path}`);
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        try {
          data = JSON.parse(lesson.content_body ?? "");
        } catch {
          data = null;
        }
      }
      setLessonData(data);
      setBlockStates((data?.blocks ?? []).map(defaultBlockState));
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.content_path, lesson.content_body]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
        Loading lesson…
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-700">
        Could not load lesson content. Please contact support.
      </div>
    );
  }

  const blocks = lessonData.blocks;
  const xpReward = lessonData.xp_reward ?? 50;
  const totalQuestions = blocks.filter(
    (b) => b.type === "multiple_choice" || b.type === "counting_game" || b.type === "fill_blank"
  ).length;
  const totalXp = blockStates.reduce((sum, s) => sum + s.xpEarned, 0);
  const correctAnswers = blockStates.filter((s) => s.correct).length;

  // stars: 3 = all correct first try, 2 = some hints used, 1 = completed
  const stars = (() => {
    const questionStates = blockStates.filter((_, i) => {
      const b = blocks[i];
      return b.type === "multiple_choice" || b.type === "counting_game" || b.type === "fill_blank";
    });
    if (questionStates.length === 0) return 3;
    if (questionStates.every((s) => s.correct && s.attempts === 1)) return 3;
    if (questionStates.every((s) => s.correct || s.revealed)) return 2;
    return 1;
  })();

  function updateBlockState(index: number, patch: Partial<BlockState>) {
    setBlockStates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function advance() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= blocks.length) {
      handleComplete();
    } else {
      setCurrentIndex(nextIndex);
      setTimeout(() => containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  async function handleComplete() {
    setDone(true);
    if (alreadyCompleted) return;
    setSubmitting(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, orgId, status: "completed" }),
    });
    setSubmitting(false);
  }

  const canProceed = blockStates[currentIndex]?.answered ?? false;
  const currentBlock = blocks[currentIndex];

  // ─── Progress bar ──────────────────────────────────────────────────────────

  const progressPercent = Math.round((currentIndex / Math.max(blocks.length - 1, 1)) * 100);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Progress bar */}
      {!done && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Step {currentIndex + 1} of {blocks.length}</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-talab-500 to-talab-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Segment dots */}
          <div className="flex gap-1.5 justify-center flex-wrap">
            {blocks.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < currentIndex
                    ? "bg-talab-500 w-4"
                    : i === currentIndex
                    ? "bg-talab-400 w-6"
                    : "bg-slate-200 w-4"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Block renderer */}
      <div key={currentIndex} className="animate-fade-in">
        {done ? (
          <SummaryScreen
            stars={stars}
            totalXp={totalXp}
            xpReward={xpReward}
            correctAnswers={correctAnswers}
            totalQuestions={totalQuestions}
            submitting={submitting}
            alreadyCompleted={alreadyCompleted}
            lessonId={lesson.id}
            courseId={lesson.course_id}
          />
        ) : currentBlock.type === "explanation" ? (
          <ExplanationBlock
            block={currentBlock}
            state={blockStates[currentIndex]}
            onContinue={() => {
              updateBlockState(currentIndex, { answered: true });
            }}
          />
        ) : currentBlock.type === "worked_example" ? (
          <WorkedExampleBlock
            block={currentBlock}
            state={blockStates[currentIndex]}
            onContinue={() => {
              updateBlockState(currentIndex, { answered: true });
            }}
          />
        ) : currentBlock.type === "multiple_choice" ? (
          <MultipleChoiceBlock
            block={currentBlock}
            state={blockStates[currentIndex]}
            xpPerQuestion={Math.round(xpReward / Math.max(totalQuestions, 1))}
            onAnswer={(correct, xp) => {
              updateBlockState(currentIndex, {
                answered: correct,
                correct,
                xpEarned: xp,
                attempts: (blockStates[currentIndex].attempts ?? 0) + 1,
              });
            }}
            onReveal={() => {
              updateBlockState(currentIndex, {
                answered: true,
                revealed: true,
                xpEarned: 0,
              });
            }}
          />
        ) : currentBlock.type === "counting_game" ? (
          <CountingGameBlock
            block={currentBlock}
            state={blockStates[currentIndex]}
            xpPerQuestion={Math.round(xpReward / Math.max(totalQuestions, 1))}
            onComplete={(xp) => {
              updateBlockState(currentIndex, {
                answered: true,
                correct: true,
                xpEarned: xp,
                attempts: 1,
              });
            }}
          />
        ) : currentBlock.type === "fill_blank" ? (
          <FillBlankBlock
            block={currentBlock}
            state={blockStates[currentIndex]}
            xpPerQuestion={Math.round(xpReward / Math.max(totalQuestions, 1))}
            onAnswer={(correct, xp) => {
              updateBlockState(currentIndex, {
                answered: correct,
                correct,
                xpEarned: xp,
                attempts: (blockStates[currentIndex].attempts ?? 0) + 1,
              });
            }}
            onReveal={() => {
              updateBlockState(currentIndex, {
                answered: true,
                revealed: true,
                xpEarned: 0,
              });
            }}
          />
        ) : currentBlock.type === "celebration" ? (
          <CelebrationBlock
            block={currentBlock}
            onContinue={() => {
              updateBlockState(currentIndex, { answered: true });
            }}
          />
        ) : null}
      </div>

      {/* Continue button */}
      {!done && canProceed && currentBlock.type !== "celebration" && (
        <div className="flex justify-end">
          <button
            onClick={advance}
            className="px-6 py-3 bg-talab-600 hover:bg-talab-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            {currentIndex === blocks.length - 1 ? "Finish Lesson →" : "Continue →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ExplanationBlock ─────────────────────────────────────────────────────────

function ExplanationBlock({
  block,
  state,
  onContinue,
}: {
  block: ExplanationBlock;
  state: BlockState;
  onContinue: () => void;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-5">
      {block.emoji && (
        <div className="text-6xl text-center">{block.emoji}</div>
      )}
      <h2 className="text-2xl font-black text-slate-800 text-center">{block.title}</h2>
      <p className="text-slate-600 text-lg leading-relaxed text-center max-w-xl mx-auto">
        {block.body}
      </p>
      {!state.answered && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onContinue}
            className="px-8 py-3 bg-talab-600 hover:bg-talab-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Got it →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── WorkedExampleBlock ───────────────────────────────────────────────────────

function WorkedExampleBlock({
  block,
  state,
  onContinue,
}: {
  block: WorkedExampleBlock;
  state: BlockState;
  onContinue: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const allRevealed = revealed >= block.steps.length;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📝</span>
        <h2 className="text-xl font-black text-slate-800">{block.title}</h2>
      </div>

      <div className="space-y-3">
        {block.steps.slice(0, revealed).map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 bg-talab-50 border border-talab-100 rounded-xl animate-fade-in"
          >
            <span className="w-7 h-7 rounded-full bg-talab-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-slate-700 font-medium">{step}</p>
          </div>
        ))}
        {revealed < block.steps.length && (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
            Step {revealed + 1} of {block.steps.length} hidden…
          </div>
        )}
      </div>

      {!allRevealed ? (
        <button
          onClick={() => setRevealed((r) => r + 1)}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
        >
          Reveal Step {revealed + 1} →
        </button>
      ) : !state.answered ? (
        <button
          onClick={onContinue}
          className="w-full py-3 bg-talab-600 hover:bg-talab-700 text-white font-semibold rounded-xl transition-colors"
        >
          Continue →
        </button>
      ) : null}
    </div>
  );
}

// ─── MultipleChoiceBlock ──────────────────────────────────────────────────────

function MultipleChoiceBlock({
  block,
  state,
  xpPerQuestion,
  onAnswer,
  onReveal,
}: {
  block: MultipleChoiceBlock;
  state: BlockState;
  xpPerQuestion: number;
  onAnswer: (correct: boolean, xp: number) => void;
  onReveal: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [localAttempts, setLocalAttempts] = useState(0);

  const isLocked = state.answered || state.revealed;

  function handleSelect(i: number) {
    if (isLocked) return;
    setSelected(i);
    const correct = i === block.correct;
    const nextAttempts = localAttempts + 1;
    setLocalAttempts(nextAttempts);

    if (correct) {
      const xp = nextAttempts === 1 ? xpPerQuestion : Math.round(xpPerQuestion / 2);
      onAnswer(true, xp);
    } else {
      setShaking(i);
      setTimeout(() => setShaking(null), 600);
      if (nextAttempts >= 1 && block.hint) setShowHint(true);
    }
  }

  function getOptionStyle(i: number) {
    if (state.answered && i === block.correct) {
      return "border-green-400 bg-green-50 text-green-800";
    }
    if (state.revealed && i === block.correct) {
      return "border-blue-400 bg-blue-50 text-blue-800";
    }
    if (selected === i && !state.answered && !state.revealed) {
      return "border-red-400 bg-red-50 text-red-700";
    }
    return "border-slate-200 bg-white text-slate-700 hover:border-talab-300 hover:bg-talab-50";
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-bold text-talab-600 uppercase tracking-wide">Question</span>
        <p className="text-xl font-bold text-slate-800">{block.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {block.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={isLocked}
            className={`p-4 rounded-xl border-2 font-semibold text-base text-left transition-all duration-200
              ${getOptionStyle(i)}
              ${shaking === i ? "animate-shake" : ""}
              ${isLocked ? "cursor-default" : "cursor-pointer"}
            `}
          >
            <span className="inline-block w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold text-center leading-6 mr-2 shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {showHint && block.hint && !isLocked && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
          <span className="text-lg">💡</span>
          <p>{block.hint}</p>
        </div>
      )}

      {state.correct && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 font-semibold">
          <span className="text-xl">✅</span>
          <span>Correct! +{state.xpEarned} XP</span>
        </div>
      )}

      {!isLocked && localAttempts >= 3 && (
        <button
          onClick={onReveal}
          className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors"
        >
          Show answer
        </button>
      )}
    </div>
  );
}

// ─── FillBlankBlock ───────────────────────────────────────────────────────────

function CountingGameBlock({
  block,
  state,
  xpPerQuestion,
  onComplete,
}: {
  block: CountingGameBlock;
  state: BlockState;
  xpPerQuestion: number;
  onComplete: (xp: number) => void;
}) {
  const [clicked, setClicked] = useState<boolean[]>(() => Array(block.count).fill(false));
  const [lastNumber, setLastNumber] = useState<number | null>(null);

  const clickedCount = clicked.filter(Boolean).length;
  const complete = clickedCount === block.count;

  function speak(text: string, cancelCurrent = true) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (cancelCurrent) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  function playPrompt() {
    speak(block.prompt);
  }

  function handleTap(index: number) {
    if (clicked[index] || state.answered) return;

    const nextNumber = clickedCount + 1;
    const nextClicked = [...clicked];
    nextClicked[index] = true;
    setClicked(nextClicked);
    setLastNumber(nextNumber);
    speak(String(nextNumber));

    if (nextNumber === block.count) {
      setTimeout(() => {
        speak(block.success ?? `${block.count}. Well done.`, false);
        onComplete(xpPerQuestion);
      }, 650);
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-8 shadow-card space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-talab-600 uppercase tracking-wide">Tap and count</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{block.prompt}</h2>
        </div>
        <button
          type="button"
          onClick={playPrompt}
          aria-label="Play instructions"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-talab-600 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v8a1 1 0 0 0 1 1h1l4 3V4L7 7H6a1 1 0 0 0-1 1z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 0 1 0 7.072" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 0 1 0 12.728" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {clicked.map((isClicked, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleTap(index)}
            disabled={isClicked || state.answered}
            aria-label={`Count item ${index + 1}`}
            className={`aspect-square rounded-2xl border-4 text-6xl sm:text-7xl flex items-center justify-center transition-all touch-manipulation ${
              isClicked
                ? "border-green-300 bg-green-50 scale-95"
                : "border-talab-200 bg-talab-50 active:scale-95 hover:border-talab-300"
            }`}
          >
            <span className={isClicked ? "grayscale opacity-70" : ""}>{block.item}</span>
          </button>
        ))}
      </div>

      <div className="min-h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        {lastNumber ? (
          <div className="text-6xl font-black text-talab-600">{lastNumber}</div>
        ) : (
          <button
            type="button"
            onClick={playPrompt}
            className="px-6 py-3 bg-white border-2 border-talab-200 text-talab-700 font-bold rounded-full"
          >
            Listen
          </button>
        )}
      </div>

      {complete && (
        <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 font-semibold">
          <span>Done</span>
          <span>+{state.xpEarned || xpPerQuestion} XP</span>
        </div>
      )}
    </div>
  );
}

function FillBlankBlock({
  block,
  state,
  xpPerQuestion,
  onAnswer,
  onReveal,
}: {
  block: FillBlankBlock;
  state: BlockState;
  xpPerQuestion: number;
  onAnswer: (correct: boolean, xp: number) => void;
  onReveal: () => void;
}) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [localAttempts, setLocalAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLocked = state.answered || state.revealed;

  function checkAnswer() {
    const trimmed = value.trim();
    const correct =
      trimmed.toLowerCase() === block.answer.toLowerCase() ||
      (!isNaN(Number(trimmed)) &&
        !isNaN(Number(block.answer)) &&
        Math.abs(Number(trimmed) - Number(block.answer)) < 0.001);

    const nextAttempts = localAttempts + 1;
    setLocalAttempts(nextAttempts);
    setFeedback(correct ? "correct" : "wrong");

    if (correct) {
      const xp = nextAttempts === 1 ? xpPerQuestion : Math.round(xpPerQuestion / 2);
      onAnswer(true, xp);
    } else {
      if (nextAttempts >= 1 && block.hint) setShowHint(true);
      setTimeout(() => {
        setFeedback(null);
        setValue("");
        inputRef.current?.focus();
      }, 800);
    }
  }

  // Render template with blank as styled input
  const [before, after] = block.template.split("___");

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-bold text-talab-600 uppercase tracking-wide">Fill in the blank</span>
        <p className="text-xl font-bold text-slate-800">{block.question}</p>
      </div>

      {/* Template with embedded input */}
      <div
        className={`flex items-center flex-wrap gap-2 text-2xl font-bold text-slate-800 p-6 rounded-xl border-2 transition-colors ${
          feedback === "correct"
            ? "border-green-400 bg-green-50"
            : feedback === "wrong"
            ? "border-red-400 bg-red-50 animate-shake"
            : state.revealed
            ? "border-blue-300 bg-blue-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <span>{before}</span>
        {isLocked ? (
          <span
            className={`px-3 py-1 rounded-lg min-w-[3rem] text-center ${
              state.answered ? "bg-green-200 text-green-900" : "bg-blue-200 text-blue-900"
            }`}
          >
            {state.answered ? value || block.answer : block.answer}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && value.trim() && checkAnswer()}
            autoFocus
            className="w-20 text-center border-b-2 border-talab-400 bg-transparent outline-none text-talab-700 placeholder-slate-300"
            placeholder="?"
          />
        )}
        {after && <span>{after}</span>}
      </div>

      {showHint && block.hint && !isLocked && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
          <span className="text-lg">💡</span>
          <p>{block.hint}</p>
        </div>
      )}

      {state.correct && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 font-semibold">
          <span className="text-xl">✅</span>
          <span>Correct! +{state.xpEarned} XP</span>
        </div>
      )}

      {state.revealed && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-800 text-sm">
          <span className="text-lg">📖</span>
          <span>The answer was <strong>{block.answer}</strong>. Keep practising!</span>
        </div>
      )}

      {!isLocked && (
        <div className="flex gap-3">
          <button
            onClick={checkAnswer}
            disabled={!value.trim()}
            className="flex-1 py-3 bg-talab-600 hover:bg-talab-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors"
          >
            Check Answer
          </button>
          {localAttempts >= 3 && (
            <button
              onClick={onReveal}
              className="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors"
            >
              Show
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CelebrationBlock ─────────────────────────────────────────────────────────

function CelebrationBlock({
  block,
  onContinue,
}: {
  block: CelebrationBlock;
  onContinue: () => void;
}) {
  useEffect(() => {
    // Advance automatically after a brief pause to let the user read
    // The parent will show the SummaryScreen
    const t = setTimeout(onContinue, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-gradient-to-b from-talab-50 to-white border border-talab-100 rounded-2xl p-10 text-center space-y-4">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-black text-slate-800">{block.message}</h2>
    </div>
  );
}

// ─── SummaryScreen ────────────────────────────────────────────────────────────

function SummaryScreen({
  stars,
  totalXp,
  xpReward,
  correctAnswers,
  totalQuestions,
  submitting,
  alreadyCompleted,
  lessonId,
  courseId,
}: {
  stars: number;
  totalXp: number;
  xpReward: number;
  correctAnswers: number;
  totalQuestions: number;
  submitting: boolean;
  alreadyCompleted: boolean;
  lessonId: string;
  courseId: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-10 shadow-card text-center space-y-6 animate-fade-in">
      {/* Stars */}
      <div className="flex justify-center gap-2 text-5xl">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`transition-all duration-300 ${s <= stars ? "opacity-100 scale-110" : "opacity-25 grayscale"}`}
          >
            ⭐
          </span>
        ))}
      </div>

      <div className="space-y-1">
        <h2 className="text-3xl font-black text-slate-800">
          {stars === 3 ? "Perfect!" : stars === 2 ? "Well done!" : "Lesson Complete!"}
        </h2>
        <p className="text-slate-500">
          {totalQuestions > 0
            ? `${correctAnswers} of ${totalQuestions} questions correct`
            : "You completed this lesson"}
        </p>
      </div>

      {/* XP badge */}
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold px-6 py-3 rounded-full text-lg">
        <span>⚡</span>
        <span>+{totalXp} XP earned</span>
      </div>

      {submitting && (
        <p className="text-sm text-slate-400">Saving progress…</p>
      )}
      {alreadyCompleted && !submitting && (
        <p className="text-sm text-slate-400">Progress already saved ✓</p>
      )}

      <div className="flex gap-3 justify-center">
        <a
          href={`/courses/${courseId}`}
          className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
        >
          ← Back to Course
        </a>
        <a
          href={`/courses/${courseId}`}
          className="px-6 py-3 bg-talab-600 hover:bg-talab-700 text-white font-semibold rounded-xl transition-colors"
        >
          Next Lesson →
        </a>
      </div>
    </div>
  );
}
