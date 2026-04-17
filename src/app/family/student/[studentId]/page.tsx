import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import StudentProgressDashboard from "@/components/StudentProgressDashboard";
import type { Course, Lesson, Profile, ProgressLog, Quiz, QuizAttempt } from "@/lib/types";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function StudentProgressPage({ params }: Props) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as Profile | null;
  if (profile?.role === "student") redirect("/dashboard");

  const { data: studentData } = await supabase
    .from("profiles").select("*").eq("id", studentId).single();
  if (!studentData) notFound();
  const student = studentData as unknown as Profile;

  if (student.org_id !== profile?.org_id && profile?.role !== "founder") {
    redirect("/family");
  }

  // Fetch all data in parallel
  const [
    { data: coursesData },
    { data: progressData },
    { data: quizAttemptsData },
  ] = await Promise.all([
    supabase.from("courses").select("*").eq("is_published", true).order("created_at"),
    supabase.from("progress_logs").select("*").eq("student_id", studentId),
    (supabase as any).from("quiz_attempts").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
  ]);

  const courses = (coursesData as unknown as Course[]) ?? [];
  const allLogs = (progressData as unknown as ProgressLog[]) ?? [];
  const allAttempts = (quizAttemptsData as unknown as QuizAttempt[]) ?? [];

  // Fetch lessons + quizzes for every course
  const courseDetails = await Promise.all(
    courses.map(async (course) => {
      const [{ data: lessonsData }, { data: quizzesData }] = await Promise.all([
        supabase.from("lessons").select("*").eq("course_id", course.id).order("position"),
        (supabase as any).from("quizzes").select("*").eq("course_id", course.id).eq("is_published", true),
      ]);
      return {
        course,
        lessons: (lessonsData as unknown as Lesson[]) ?? [],
        quizzes: (quizzesData as unknown as Quiz[]) ?? [],
      };
    })
  );

  // Build lookup maps
  const logByLesson: Record<string, ProgressLog> = Object.fromEntries(
    allLogs.map((l) => [l.lesson_id, l])
  );
  // Best attempt per quiz
  const bestAttemptByQuiz: Record<string, QuizAttempt> = {};
  for (const attempt of allAttempts) {
    const existing = bestAttemptByQuiz[attempt.quiz_id];
    if (!existing || attempt.score > existing.score) {
      bestAttemptByQuiz[attempt.quiz_id] = attempt;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <a href="/family" className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1 mb-6">
          ← Back to Family
        </a>
        <StudentProgressDashboard
          student={student}
          courseDetails={courseDetails}
          logByLesson={logByLesson}
          bestAttemptByQuiz={bestAttemptByQuiz}
          totalAttempts={allAttempts.length}
        />
      </main>
    </div>
  );
}
