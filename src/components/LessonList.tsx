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
      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="w-7 h-7 rounded-full bg-talab-100 border-2 border-talab-400 flex items-center justify-center flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-talab-500" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full border-2 border-slate-200 bg-white flex-shrink-0" />
  );
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  video:   { label: "Video",   color: "text-blue-500 bg-blue-50" },
  game:    { label: "Game",    color: "text-purple-600 bg-purple-50" },
  content: { label: "Reading", color: "text-slate-500 bg-slate-100" },
};

export default function LessonList({ lessons, courseId, progressMap, hasAccess = true }: Props) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
        <p className="text-slate-400">No lessons yet.</p>
        <Link href={`/admin/courses/${courseId}/lessons/new`} className="text-talab-600 hover:text-talab-700 text-sm mt-2 inline-block font-medium">
          + Add the first lesson
        </Link>
      </div>
    );
  }

  const completedCount = lessons.filter((l) => progressMap[l.id] === "completed").length;
  const pct = Math.round((completedCount / lessons.length) * 100);

  return (
    <div className="space-y-3">
      {/* Mini overall progress */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-1">
        <span>{completedCount} of {lessons.length} lessons complete</span>
        <span className="font-semibold text-talab-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-talab-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {lessons.map((lesson, idx) => {
        const status = progressMap[lesson.id];
        const href = hasAccess ? `/lessons/${lesson.id}` : "/billing";
        const typeStyle = TYPE_LABELS[lesson.lesson_type] ?? TYPE_LABELS.content;

        return (
          <Link
            key={lesson.id}
            href={href}
            className={`group flex items-center gap-4 bg-white border-2 rounded-2xl px-5 py-4 transition-all shadow-card ${
              status === "completed"
                ? "border-green-100 hover:border-green-200"
                : hasAccess
                ? "border-slate-100 hover:border-talab-200 hover:shadow-card-hover"
                : "border-slate-100 opacity-60 cursor-default"
            }`}
          >
            {hasAccess ? (
              <StatusIcon status={status} />
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">{idx + 1}</span>
                <span className={`text-sm font-semibold truncate transition-colors ${
                  status === "completed" ? "text-slate-400 line-through decoration-slate-300" :
                  hasAccess ? "text-slate-800 group-hover:text-talab-600" : "text-slate-400"
                }`}>
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.color}`}>
                  {typeStyle.label}
                  {lesson.lesson_type === "game" && lesson.game_pass_score && ` · pass ${lesson.game_pass_score}`}
                </span>
                {lesson.duration_seconds && (
                  <span className="text-xs text-slate-300">{Math.round(lesson.duration_seconds / 60)}m</span>
                )}
              </div>
            </div>

            {status === "completed" ? (
              <span className="text-xs font-semibold text-green-500 flex-shrink-0">Done</span>
            ) : (
              <svg className="w-4 h-4 text-slate-300 group-hover:text-talab-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Link>
        );
      })}
    </div>
  );
}
