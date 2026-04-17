import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import LessonList from "@/components/LessonList";
import Link from "next/link";
import type { Course, Lesson, Profile, ProgressLog, Quiz } from "@/lib/types";

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
  const quizzes = (quizzesData as unknown as Quiz[]) ?? [];

  const visibleQuizzes = profile?.role === "founder"
    ? quizzes
    : quizzes.filter((q) => q.is_published);

  const { data: progressData } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("student_id", user.id)
    .in("lesson_id", lessons.map((l) => l.id));

  const progressLogs = (progressData as unknown as ProgressLog[]) ?? [];
  const progressMap: Record<string, string> = Object.fromEntries(
    progressLogs.map((p) => [p.lesson_id, p.status])
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <a href="/dashboard" className="text-sm text-talab-500 hover:text-talab-400 mb-4 inline-flex items-center gap-1">
            ← Back to Dashboard
          </a>
          <div className="mt-4">
            <span className="text-xs font-medium uppercase tracking-wider text-talab-400 bg-talab-900/30 px-2 py-1 rounded">
              {course.subject_category}
            </span>
            <h1 className="text-3xl font-bold text-white mt-2">{course.title}</h1>
            {course.description && (
              <p className="text-gray-400 mt-2">{course.description}</p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{lessons.length} lessons</span>
            <span>{Object.values(progressMap).filter((s) => s === "completed").length} completed</span>
            <span>{visibleQuizzes.length} quiz{visibleQuizzes.length !== 1 ? "zes" : ""}</span>
            {profile?.role === "founder" && (
              <>
                <Link href={`/admin/courses/${courseId}/lessons/new`} className="text-talab-500 hover:text-talab-400 font-medium">
                  + Lesson
                </Link>
                <Link href={`/admin/courses/${courseId}/quizzes/new`} className="text-talab-500 hover:text-talab-400 font-medium">
                  + Quiz
                </Link>
                <Link href={`/admin/courses/${courseId}/edit`} className="text-gray-500 hover:text-gray-300 font-medium">
                  Edit Course
                </Link>
              </>
            )}
          </div>
        </div>

        <LessonList lessons={lessons} courseId={courseId} progressMap={progressMap} />

        {/* Quizzes section */}
        {visibleQuizzes.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white mb-4">Quizzes</h2>
            <div className="space-y-3">
              {visibleQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/courses/${courseId}/quiz/${quiz.id}`}
                  className="group flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-talab-700 transition-all"
                >
                  <div className="w-9 h-9 bg-purple-900/30 border border-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm group-hover:text-talab-400 transition-colors">
                      {quiz.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pass mark: {quiz.pass_score}%
                      {!quiz.is_published && <span className="ml-2 text-yellow-600">Draft</span>}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-talab-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
