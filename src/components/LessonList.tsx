import Link from "next/link";
import type { Lesson } from "@/lib/types";

interface Props {
  lessons: Lesson[];
  courseId: string;
  progressMap: Record<string, string>;
  hasAccess?: boolean;
}

function StatusIcon({ status }: { status: string | undefined }) {
  if (status === "completed") {
    return (
      <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="w-6 h-6 rounded-full bg-talab-600/20 border border-talab-500 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-talab-400" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full border border-gray-700 flex-shrink-0" />
  );
}

export default function LessonList({ lessons, courseId, progressMap, hasAccess = true }: Props) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>No lessons yet.</p>
        <Link
          href={`/admin/courses/${courseId}/lessons/new`}
          className="text-talab-500 hover:text-talab-400 text-sm mt-2 inline-block"
        >
          + Add the first lesson
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson, idx) => {
        const status = progressMap[lesson.id];
        const href = hasAccess ? `/lessons/${lesson.id}` : "/billing";
        return (
          <Link
            key={lesson.id}
            href={href}
            className={`group flex items-center gap-4 bg-gray-900 border rounded-xl px-5 py-4 transition-all ${
              hasAccess
                ? "border-gray-800 hover:border-talab-700 hover:bg-gray-900/80"
                : "border-gray-800 opacity-60 cursor-default"
            }`}
          >
            {hasAccess ? (
              <StatusIcon status={status} />
            ) : (
              <div className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">#{idx + 1}</span>
                <span className="text-sm font-medium text-white group-hover:text-talab-400 transition-colors truncate">
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {lesson.lesson_type === "game" ? (
                  <span className="text-xs text-purple-400 flex items-center gap-1">
                    🎮 Game
                    {lesson.game_pass_score && (
                      <span className="text-gray-600 ml-1">· pass {lesson.game_pass_score}</span>
                    )}
                  </span>
                ) : (
                  <>
                    {lesson.r2_key && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Video
                      </span>
                    )}
                    {lesson.content_body && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Reading
                      </span>
                    )}
                  </>
                )}
                {lesson.duration_seconds && (
                  <span className="text-xs text-gray-600">
                    {Math.round(lesson.duration_seconds / 60)}m
                  </span>
                )}
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-600 group-hover:text-talab-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
