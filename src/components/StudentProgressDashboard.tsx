"use client";

import { useState } from "react";
import type { Course, Lesson, Profile, ProgressLog, Quiz, QuizAttempt } from "@/lib/types";

interface CourseDetail {
  course: Course;
  lessons: Lesson[];
  quizzes: Quiz[];
}

interface Props {
  student: Profile;
  courseDetails: CourseDetail[];
  logByLesson: Record<string, ProgressLog>;
  bestAttemptByQuiz: Record<string, QuizAttempt>;
  totalAttempts: number;
}

function ScoreRing({ pct, passed, size = 48 }: { pct: number; passed: boolean; size?: number }) {
  const r = 15.9;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className="-rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#1f2937" strokeWidth="3" />
      <circle
        cx="18" cy="18" r={r} fill="none"
        stroke={passed ? "#22c55e" : "#0ea5e9"}
        strokeWidth="3"
        strokeDasharray={`${pct} ${100 - pct}`}
        strokeLinecap="round"
      />
      <text
        x="18" y="18"
        textAnchor="middle" dominantBaseline="central"
        className="rotate-90"
        style={{ transform: "rotate(90deg)", transformOrigin: "18px 18px" }}
        fontSize="8" fontWeight="bold"
        fill={passed ? "#22c55e" : "#94a3b8"}
      >
        {pct}%
      </text>
    </svg>
  );
}

function LessonRow({ lesson, log }: { lesson: Lesson; log: ProgressLog | undefined }) {
  const status = log?.status ?? "not_started";
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-800/60 last:border-0">
      {status === "completed" ? (
        <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : status === "in_progress" ? (
        <div className="w-5 h-5 rounded-full bg-talab-600/20 border border-talab-500 flex items-center justify-center flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-talab-400" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border border-gray-700 flex-shrink-0" />
      )}

      <span className="flex-1 text-sm text-gray-300 truncate">{lesson.title}</span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {lesson.lesson_type === "game" && (
          <span className="text-xs text-purple-400">🎮</span>
        )}
        {lesson.lesson_type === "game" && log?.game_score != null && (
          <span className={`text-xs font-medium ${
            log.status === "completed" ? "text-green-400" : "text-gray-500"
          }`}>
            {log.game_score} pts
          </span>
        )}
        {status === "completed" && log?.completed_at && (
          <span className="text-xs text-gray-600">
            {new Date(log.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

function CourseCard({
  course, lessons, quizzes, logByLesson, bestAttemptByQuiz,
}: CourseDetail & { logByLesson: Record<string, ProgressLog>; bestAttemptByQuiz: Record<string, QuizAttempt> }) {
  const [expanded, setExpanded] = useState(false);

  const completed = lessons.filter((l) => logByLesson[l.id]?.status === "completed").length;
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
  const quizzesPassed = quizzes.filter((q) => bestAttemptByQuiz[q.id]?.passed).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Course header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-talab-400 bg-talab-900/30 px-2 py-0.5 rounded font-medium">
                {course.subject_category}
              </span>
            </div>
            <h3 className="text-white font-semibold">{course.title}</h3>
          </div>
          <span className="text-2xl font-bold text-talab-400 flex-shrink-0">{pct}%</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-talab-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span>{completed}/{lessons.length} lessons</span>
          {quizzes.length > 0 && (
            <span>{quizzesPassed}/{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} passed</span>
          )}
        </div>
      </div>

      {/* Quiz scores */}
      {quizzes.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-3">
          {quizzes.map((quiz) => {
            const attempt = bestAttemptByQuiz[quiz.id];
            const qPct = attempt ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
            return (
              <div key={quiz.id} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
                <ScoreRing pct={qPct} passed={attempt?.passed ?? false} size={36} />
                <div>
                  <p className="text-xs font-medium text-white leading-tight">{quiz.title}</p>
                  <p className="text-xs text-gray-500">
                    {attempt ? (attempt.passed ? "Passed ✓" : `Need ${quiz.pass_score}%`) : "Not attempted"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lesson breakdown toggle */}
      {lessons.length > 0 && (
        <div className="border-t border-gray-800">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <span>Lesson breakdown</span>
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-5 pb-4">
              {lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} log={logByLesson[lesson.id]} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentProgressDashboard({
  student, courseDetails, logByLesson, bestAttemptByQuiz, totalAttempts,
}: Props) {
  const totalLessons = courseDetails.reduce((s, c) => s + c.lessons.length, 0);
  const completedLessons = courseDetails.reduce(
    (s, c) => s + c.lessons.filter((l) => logByLesson[l.id]?.status === "completed").length, 0
  );
  const totalQuizzes = courseDetails.reduce((s, c) => s + c.quizzes.length, 0);
  const passedQuizzes = courseDetails.reduce(
    (s, c) => s + c.quizzes.filter((q) => bestAttemptByQuiz[q.id]?.passed).length, 0
  );
  const gamesCompleted = courseDetails.reduce(
    (s, c) => s + c.lessons.filter(
      (l) => l.lesson_type === "game" && logByLesson[l.id]?.status === "completed"
    ).length, 0
  );
  const totalGames = courseDetails.reduce(
    (s, c) => s + c.lessons.filter((l) => l.lesson_type === "game").length, 0
  );

  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Student header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-talab-900/50 border-2 border-talab-700 flex items-center justify-center text-xl font-bold text-talab-300">
          {student.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{student.full_name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">Student · Progress Report</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-talab-400">{overallPct}%</p>
          <p className="text-xs text-gray-500 mt-1">Overall</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{completedLessons}</p>
          <p className="text-xs text-gray-500 mt-1">of {totalLessons} lessons</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{passedQuizzes}</p>
          <p className="text-xs text-gray-500 mt-1">of {totalQuizzes} quizzes</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{gamesCompleted}</p>
          <p className="text-xs text-gray-500 mt-1">of {totalGames} games</p>
        </div>
      </div>

      {/* Per-course cards */}
      <div className="space-y-4">
        {courseDetails.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No published courses yet.</p>
        ) : (
          courseDetails.map(({ course, lessons, quizzes }) => (
            <CourseCard
              key={course.id}
              course={course}
              lessons={lessons}
              quizzes={quizzes}
              logByLesson={logByLesson}
              bestAttemptByQuiz={bestAttemptByQuiz}
            />
          ))
        )}
      </div>
    </div>
  );
}
