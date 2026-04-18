import Link from "next/link";
import type { Course } from "@/lib/types";

const SUBJECT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  Maths:      { bg: "bg-blue-500",   text: "text-blue-600",   icon: "🔢" },
  Math:       { bg: "bg-blue-500",   text: "text-blue-600",   icon: "🔢" },
  English:    { bg: "bg-violet-500", text: "text-violet-600", icon: "📖" },
  History:    { bg: "bg-amber-500",  text: "text-amber-600",  icon: "🏛️" },
  Technology: { bg: "bg-teal-500",   text: "text-teal-600",   icon: "💻" },
  Science:    { bg: "bg-green-500",  text: "text-green-600",  icon: "🔬" },
  Arabic:     { bg: "bg-rose-500",   text: "text-rose-600",   icon: "📜" },
  Quran:      { bg: "bg-emerald-500",text: "text-emerald-600",icon: "🌙" },
  Art:        { bg: "bg-pink-500",   text: "text-pink-600",   icon: "🎨" },
  PE:         { bg: "bg-orange-500", text: "text-orange-600", icon: "⚽" },
};

const DEFAULT_STYLE = { bg: "bg-slate-400", text: "text-slate-600", icon: "📚" };

interface Props {
  course: Course;
  isFounder?: boolean;
  hasAccess?: boolean;
}

export default function CourseCard({ course, isFounder, hasAccess = true }: Props) {
  const style = SUBJECT_STYLES[course.subject_category] ?? DEFAULT_STYLE;
  const locked = !hasAccess && !course.is_free && !isFounder;

  return (
    <div className={`relative group bg-white border-2 rounded-2xl overflow-hidden transition-all duration-200 shadow-card ${
      locked
        ? "border-slate-100 opacity-75"
        : "border-slate-100 hover:border-slate-200 hover:shadow-card-hover"
    }`}>
      {/* Coloured top stripe */}
      <div className={`h-2 w-full ${style.bg} ${locked ? "opacity-40" : ""}`} />

      {isFounder && (
        <Link
          href={`/admin/courses/${course.id}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-lg transition-all z-10"
        >
          Edit
        </Link>
      )}

      <Link href={locked ? "/billing" : `/courses/${course.id}`} className="block p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center text-lg ${locked ? "opacity-40" : ""}`}>
            {style.icon}
          </div>
          <div className="flex items-center gap-2">
            {!course.is_published && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                Draft
              </span>
            )}
            {course.is_free ? (
              <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                Free
              </span>
            ) : (
              <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">
                Premium
              </span>
            )}
          </div>
        </div>

        <h3 className={`text-base font-bold leading-snug ${locked ? "text-slate-400" : "text-slate-800 group-hover:text-talab-600"} transition-colors`}>
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{course.description}</p>
        )}

        {(course.lessonCount ?? 0) === 0 ? (
          <p className="mt-3 text-xs text-slate-300 italic">Coming soon</p>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{course.lessonCount} lesson{(course.lessonCount ?? 0) !== 1 ? "s" : ""}
                {(course.quizCount ?? 0) > 0 && ` · ${course.quizCount} quiz${(course.quizCount ?? 0) !== 1 ? "zes" : ""}`}
              </span>
              <span className={`font-semibold ${(course.completedCount ?? 0) > 0 ? style.text : "text-slate-300"}`}>
                {course.completedCount ?? 0}/{course.lessonCount} done
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${style.bg} rounded-full transition-all duration-500`}
                style={{ width: `${course.lessonCount ? Math.round(((course.completedCount ?? 0) / course.lessonCount) * 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 text-sm font-semibold">
          {locked ? (
            <span className="text-amber-500 flex items-center gap-1.5 text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Subscribe to unlock
            </span>
          ) : (
            <span className={`flex items-center gap-1 text-xs ${style.text}`}>
              Start learning
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
