"use client";

import { useState, useMemo } from "react";
import CourseCard from "@/components/CourseCard";
import type { Course } from "@/lib/types";

const SUBJECTS = ["All", "Maths", "Math", "English", "History", "Technology", "Science", "Arabic", "Quran", "Art", "PE", "Other"];

interface Props {
  courses: Course[];
  isFounder: boolean;
  hasAccess: boolean;
}

export default function CourseGrid({ courses, isFounder, hasAccess }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "free" && c.is_free) ||
        (filter === "premium" && !c.is_free);
      return matchesQuery && matchesFilter;
    });
  }, [courses, query, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-talab-400 focus:ring-2 focus:ring-talab-100 text-sm transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "free", "premium"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                filter === f
                  ? "bg-talab-600 border-talab-600 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {f === "all" ? "All" : f === "free" ? "Free" : "Premium"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium">No courses match your search.</p>
          <button
            onClick={() => { setQuery(""); setFilter("all"); }}
            className="text-talab-600 text-sm mt-2 hover:text-talab-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} isFounder={isFounder} hasAccess={hasAccess} />
          ))}
        </div>
      )}
    </div>
  );
}
