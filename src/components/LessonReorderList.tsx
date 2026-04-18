"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/types";

interface Props {
  lessons: Lesson[];
  courseId: string;
  progressMap: Record<string, string>;
}

export default function LessonReorderList({ lessons: initial, courseId, progressMap }: Props) {
  const [lessons, setLessons] = useState(initial);
  const [moving, setMoving] = useState<string | null>(null);

  async function move(lessonId: string, direction: "up" | "down") {
    setMoving(lessonId);

    // Optimistic reorder
    const idx = lessons.findIndex((l) => l.id === lessonId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) { setMoving(null); return; }

    const next = [...lessons];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setLessons(next);

    await fetch("/api/admin/lessons/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, direction }),
    });

    setMoving(null);
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson, idx) => {
        const status = progressMap[lesson.id];
        return (
          <div
            key={lesson.id}
            className="group flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-talab-700 transition-all"
          >
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => move(lesson.id, "up")}
                disabled={idx === 0 || moving === lesson.id}
                className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                title="Move up"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => move(lesson.id, "down")}
                disabled={idx === lessons.length - 1 || moving === lesson.id}
                className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                title="Move down"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Status dot */}
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {status === "completed" ? (
                <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-gray-700" />
              )}
            </div>

            {/* Title link */}
            <Link href={`/lessons/${lesson.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">#{idx + 1}</span>
                <span className="text-sm font-medium text-white group-hover:text-talab-400 transition-colors truncate">
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {lesson.lesson_type === "game" && (
                  <span className="text-xs text-purple-400">🎮 Game</span>
                )}
                {lesson.lesson_type === "video" && lesson.r2_key && (
                  <span className="text-xs text-gray-500">🎬 Video</span>
                )}
                {lesson.duration_seconds && (
                  <span className="text-xs text-gray-600">{Math.round(lesson.duration_seconds / 60)}m</span>
                )}
              </div>
            </Link>

            {/* Edit link */}
            <Link
              href={`/admin/lessons/${lesson.id}/edit`}
              className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-1 rounded-lg transition-all flex-shrink-0"
            >
              Edit
            </Link>
          </div>
        );
      })}
    </div>
  );
}
