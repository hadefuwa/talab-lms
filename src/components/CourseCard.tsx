import Link from "next/link";
import type { Course } from "@/lib/types";

const SUBJECT_COLORS: Record<string, string> = {
  Math: "bg-blue-900/30 text-blue-400 border-blue-800",
  Science: "bg-green-900/30 text-green-400 border-green-800",
  English: "bg-purple-900/30 text-purple-400 border-purple-800",
  History: "bg-amber-900/30 text-amber-400 border-amber-800",
  Arabic: "bg-rose-900/30 text-rose-400 border-rose-800",
  Quran: "bg-teal-900/30 text-teal-400 border-teal-800",
  default: "bg-gray-800 text-gray-400 border-gray-700",
};

interface Props {
  course: Course;
  isFounder?: boolean;
}

export default function CourseCard({ course, isFounder }: Props) {
  const colorClass = SUBJECT_COLORS[course.subject_category] ?? SUBJECT_COLORS.default;

  return (
    <div className="relative group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-talab-700 hover:shadow-lg hover:shadow-talab-900/20 transition-all duration-200">
      {isFounder && (
        <Link
          href={`/admin/courses/${course.id}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-1 rounded-lg transition-all z-10"
        >
          Edit
        </Link>
      )}

      <Link href={`/courses/${course.id}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <span className={`text-xs font-medium px-2 py-1 rounded border ${colorClass}`}>
            {course.subject_category}
          </span>
          {!course.is_published && (
            <span className="text-xs text-yellow-500 bg-yellow-900/20 border border-yellow-800/50 px-2 py-0.5 rounded mr-10">
              Draft
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white group-hover:text-talab-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{course.description}</p>
        )}
        <div className="mt-4 flex items-center gap-1 text-talab-500 text-sm font-medium">
          View course
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </div>
  );
}
