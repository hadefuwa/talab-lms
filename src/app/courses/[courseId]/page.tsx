import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import LessonList from "@/components/LessonList";
import LessonReorderList from "@/components/LessonReorderList";
import Link from "next/link";
import type { Course, Lesson, Organization, Profile, ProgressLog, Quiz } from "@/lib/types";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profileData },
    { data: courseData },
    { data: lessonsData },
    { data: quizzesData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("courses").select("*").eq("id", courseId).single(),
    supabase.from("lessons").select("*").eq("course_id", courseId).order("position"),
    (supabase as any).from("quizzes").select("*").eq("course_id", courseId).order("created_at"),
  ]);

  if (!courseData) notFound();

  const profile = profileData as unknown as Profile | null;
  const course = courseData as unknown as Course;
  const lessons = (lessonsData as unknown as Lesson[]) ?? [];
  const isFounder = profile?.role === "founder";

  let hasAccess = isFounder || course.is_free;
  if (!hasAccess && profile?.org_id) {
    const { data: orgData } = await supabase
      .from("organizations").select("subscription_status").eq("id", profile.org_id).single();
    const org = orgData as unknown as Organization | null;
    hasAccess = org?.subscription_status === "active" || org?.subscription_status === "trialing";
  }

  const quizzes = (quizzesData as unknown as Quiz[]) ?? [];
  const visibleQuizzes = isFounder ? quizzes : quizzes.filter((q) => q.is_published);

  const { data: progressData } = await supabase
    .from("progress_logs").select("*").eq("student_id", user.id)
    .in("lesson_id", lessons.map((l) => l.id));

  const progressLogs = (progressData as unknown as ProgressLog[]) ?? [];
  const progressMap: Record<string, string> = Object.fromEntries(
    progressLogs.map((p) => [p.lesson_id, p.status])
  );

  const completedCount = Object.values(progressMap).filter((s) => s === "completed").length;
  const allComplete = lessons.length > 0 && completedCount === lessons.length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <a href="/dashboard" className="text-sm text-talab-600 hover:text-talab-700 font-medium mb-6 inline-flex items-center gap-1">
          ← Back to Dashboard
        </a>

        {/* Header card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-talab-600 bg-talab-50 px-2.5 py-1 rounded-full">
                {course.subject_category}
              </span>
              <h1 className="text-2xl font-black text-slate-800 mt-3">{course.title}</h1>
              {course.description && (
                <p className="text-slate-500 mt-2 leading-relaxed">{course.description}</p>
              )}
            </div>
            {isFounder && (
              <Link href={`/admin/courses/${courseId}/edit`} className="flex-shrink-0 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium">
                Edit Course
              </Link>
            )}
          </div>

          {/* Progress bar */}
          {!isFounder && lessons.length > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>{completedCount} of {lessons.length} lessons complete</span>
                <span className="font-semibold text-talab-600">{progressPct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-talab-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
            <span>{visibleQuizzes.length} quiz{visibleQuizzes.length !== 1 ? "zes" : ""}</span>
            {allComplete && !isFounder && (
              <Link href={`/courses/${courseId}/certificate`} className="ml-auto flex items-center gap-1.5 text-amber-500 hover:text-amber-600 font-semibold transition-colors text-sm">
                🏆 View Certificate
              </Link>
            )}
            {isFounder && (
              <div className="ml-auto flex gap-3">
                <Link href={`/admin/courses/${courseId}/lessons/new`} className="text-talab-600 hover:text-talab-700 font-semibold text-sm">
                  + Lesson
                </Link>
                <Link href={`/admin/courses/${courseId}/quizzes/new`} className="text-talab-600 hover:text-talab-700 font-semibold text-sm">
                  + Quiz
                </Link>
              </div>
            )}
          </div>
        </div>

        {!hasAccess && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-800 font-bold">Premium Course</p>
              <p className="text-amber-600 text-sm mt-0.5">Subscribe to unlock all lessons in this course.</p>
            </div>
            <Link href="/billing" className="flex-shrink-0 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors">
              Subscribe
            </Link>
          </div>
        )}

        {isFounder ? (
          <LessonReorderList lessons={lessons} courseId={courseId} progressMap={progressMap} />
        ) : (
          <LessonList lessons={lessons} courseId={courseId} progressMap={progressMap} hasAccess={hasAccess} />
        )}

        {visibleQuizzes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quizzes</h2>
            <div className="space-y-3">
              {visibleQuizzes.map((quiz) => (
                <div key={quiz.id} className="group relative flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-5 py-4 hover:border-violet-200 hover:shadow-card transition-all shadow-card">
                  {isFounder && (
                    <Link
                      href={`/admin/courses/${courseId}/quizzes/${quiz.id}/edit`}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded transition-all z-10"
                    >
                      Edit
                    </Link>
                  )}
                  <Link href={`/courses/${courseId}/quiz/${quiz.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-semibold text-sm group-hover:text-violet-600 transition-colors">{quiz.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Pass mark: {quiz.pass_score}%
                        {!quiz.is_published && <span className="ml-2 text-amber-500 font-medium">Draft</span>}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
