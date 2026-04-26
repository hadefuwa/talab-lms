"use client";

import { useEffect, useRef, useState } from "react";
import type { Lesson, ProgressLog } from "@/lib/types";

interface Props {
  lesson: Lesson;
  orgId: string;
  existingProgress: ProgressLog | null;
  nextLessonId?: string | null;
}

type GameResult = {
  score: number;
  passScore: number;
  passed: boolean;
  bestScore: number;
};

export default function GameLesson({ lesson, orgId, existingProgress, nextLessonId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const alreadyPassed = existingProgress?.status === "completed";
  const bestPrior = (existingProgress as any)?.game_score ?? null;

  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const isGameOver = e.data?.type === "GAME_OVER";
      const isLegacyKs1Complete = e.data?.type === "lessonCompleted";
      if (!isGameOver && !isLegacyKs1Complete) return;

      const score: number = isLegacyKs1Complete
        ? lesson.game_pass_score ?? 1
        : e.data.score ?? 0;
      setSubmitting(true);

      const res = await fetch("/api/game/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, score, orgId }),
      });
      const data: GameResult = await res.json();
      setResult(data);
      setSubmitting(false);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [lesson.id, orgId]);

  const sep = lesson.game_path?.includes('?') ? '&' : '?';
  const gameSrc = `${lesson.game_path}${sep}passScore=${lesson.game_pass_score ?? 5}&t=${reloadKey}`;
  const isImportedLabGame = lesson.game_path?.includes("/ks1-lab/") || lesson.game_path?.includes("/ks2-lab/");

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">Pass mark:</span>
          <span className="text-white font-semibold">{lesson.game_pass_score ?? 5} points</span>
          {bestPrior !== null && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-gray-400">Your best:</span>
              <span className="text-white font-semibold">{bestPrior}</span>
            </>
          )}
        </div>
        {alreadyPassed && !result && (
          <span className="text-xs bg-green-900/30 text-green-400 border border-green-800 px-2 py-1 rounded-full">
            ✓ Completed
          </span>
        )}
      </div>

      {/* Game iframe */}
      <div
        className={`relative bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 mx-auto w-full ${
          isImportedLabGame ? "max-w-7xl h-[clamp(42rem,calc(100dvh-12rem),56rem)]" : "max-w-sm"
        }`}
        style={isImportedLabGame ? undefined : { aspectRatio: "380 / 570" }}
      >
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={gameSrc}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title={lesson.title}
        />
        {submitting && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60">
            <div className="text-white text-sm">Saving score…</div>
          </div>
        )}
      </div>

      {/* Result card */}
      {result && (
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between ${
          result.passed
            ? "bg-green-900/15 border-green-800"
            : "bg-gray-900 border-gray-800"
        }`}>
          <div>
            <p className={`font-semibold text-base ${result.passed ? "text-green-400" : "text-white"}`}>
              {result.passed ? "🎉 Lesson complete!" : "📚 Keep practising"}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              Score: <span className="text-white font-medium">{result.score}</span>
              {result.bestScore > result.score && (
                <> &nbsp;·&nbsp; Best: <span className="text-white font-medium">{result.bestScore}</span></>
              )}
              &nbsp;·&nbsp; Need <span className="text-white font-medium">{result.passScore}</span> to pass
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setResult(null); setReloadKey(k => k + 1); }}
              className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Play Again
            </button>
            {result.passed && nextLessonId && (
              <a
                href={`/lessons/${nextLessonId}`}
                className="text-sm px-4 py-2 bg-talab-600 hover:bg-talab-700 text-white rounded-lg transition-colors font-medium"
              >
                Continue →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
