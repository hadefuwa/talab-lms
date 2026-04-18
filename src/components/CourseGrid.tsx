"use client";

import { useState, useMemo } from "react";
import CourseCard from "@/components/CourseCard";
import type { Course } from "@/lib/types";

const SUBJECTS = ["All", "Math", "Science", "English", "History", "Arabic", "Quran", "Art", "PE", "Other"];

interface Props {
  courses: Course[];
  isFounder: boolean;
  hasAccess: boolean;
}

export default function CourseGrid({ courses, isFounder, hasAccess }: Props) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesSubject = subject === "All" || c.subject_category === subject;
      const matchesFilter =
        filter === "all" ||
        (filter === "free" && c.is_free) ||
        (filter === "premium" && !c.is_free);
      return matchesQuery && matchesSubject && matchesFilter;
    });
  }, [courses, query, subject, filter]);

  // Only show subjects that have courses
  const activeSubjects = SUBJECTS.filter(
    (s) => s === "All" || courses.some((c) => c.subject_category === s)
  );

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 text-sm"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "free", "premium"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                filter === f
                  ? "bg-talab-600 border-talab-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              {f === "all" ? "All" : f === "free" ? "Free" : "Premium"}
            </button>
          ))}
        </div>
      </div>

      {/* Subject pills */}
      {activeSubjects.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {activeSubjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                subject === s
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No courses match your search.</p>
          <button onClick={() => { setQuery(""); setSubject("All"); setFilter("all"); }} className="text-talab-500 text-sm mt-2 hover:text-talab-400">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} isFounder={isFounder} hasAccess={hasAccess} />
          ))}
        </div>
      )}
    </div>
  );
}
