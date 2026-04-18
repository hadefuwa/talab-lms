import Link from "next/link";
import type { Course } from "@/lib/types";

const SUBJECT_COLORS: Record<string, string> = {
  Math: "bg-blue-900/30 text-blue-400 border-blue-800",
  Maths: "bg-blue-900/30 text-blue-400 border-blue-800",
  Science: "bg-green-900/30 text-green-400 border-green-800",
  English: "bg-purple-900/30 text-purple-400 border-purple-800",
  History: "bg-amber-900/30 text-amber-400 border-amber-800",
  Technology: "bg-cyan-900/30 text-cyan-400 border-cyan-800",
  Arabic: "bg-rose-900/30 text-rose-400 border-rose-800",
  Quran: "bg-teal-900/30 text-teal-400 border-teal-800",
  default: "bg-gray-800 text-gray-400 border-gray-700",
};

interface Props {
  course: Course;
  isFounder?: boolean;
  hasAccess?: boolean;
}

export default function CourseCard({ course, isFounder, hasAccess = true }: Props) {
  const colorClass = SUBJECT_COLORS[course.subject_category] ?? SUBJECT_COLORS.default;
  const locked = !hasAccess && !course.is_free && !isFounder;

  return (
    <div className={`relative group bg-gray-900 border rounded-2xl p-6 transition-all duration-200 ${
      locked
        ? "border-gray-800 opacity-75"
        : "border-gray-800 hover:border-talab-700 hover:shadow-lg hover:shadow-talab-900/20"
    }`}>
      {isFounder && (
        <Link
          href={`/admin/courses/${course.id}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-1 rounded-lg transition-all z-10"
        >
          Edit
        </Link>
      )}

      <Link href={locked ? "/billing" : `/courses/${course.id}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <span className={`text-xs font-medium px-2 py-1 rounded border ${colorClass}`}>
            {course.subject_category}
          </span>
          <div className="flex items-center gap-2">
            {!course.is_published && (
              <span className="text-xs text-yellow-500 bg-yellow-900/20 border border-yellow-800/50 px-2 py-0.5 rounded">
                Draft
              </span>
            )}
            {course.is_free ? (
              <span className="text-xs text-green-400 bg-green-900/20 border border-green-800/50 px-2 py-0.5 rounded font-medium">
                Free
              </span>
            ) : (
              <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/50 px-2 py-0.5 rounded font-medium">
                Premium
              </span>
            )}
          </div>
        </div>
        <h3 className={`text-lg font-semibold transition-colors line-clamp-2 ${locked ? "text-gray-500" : "text-white group-hover:text-talab-400"}`}>
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{course.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {course.lessonCount ?? 0} lesson{(course.lessonCount ?? 0) !== 1 ? "s" : ""}
          </span>
          {(course.quizCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {course.quizCount} quiz{(course.quizCount ?? 0) !== 1 ? "zes" : ""}
            </span>
          )}
          {(course.lessonCount ?? 0) === 0 && (
            <span className="text-gray-600 italic">Coming soon</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm font-medium">
          {locked ? (
            <span className="text-amber-500 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Subscribe to unlock
            </span>
          ) : (
            <span className="text-talab-500 flex items-center gap-1">
              View course
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
