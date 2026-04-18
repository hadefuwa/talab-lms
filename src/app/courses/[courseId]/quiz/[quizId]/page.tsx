import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuizPlayer from "@/components/QuizPlayer";
import QuizHistory from "@/components/QuizHistory";
import type { Profile, Quiz, QuizAttempt, QuizQuestion } from "@/lib/types";

interface Props {
  params: Promise<{ courseId: string; quizId: string }>;
}

export default async function QuizPage({ params }: Props) {
  const { courseId, quizId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: quizData }, { data: questionsData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    (supabase as any).from("quizzes").select("*").eq("id", quizId).single(),
    (supabase as any).from("quiz_questions").select("*").eq("quiz_id", quizId).order("position"),
  ]);

  if (!quizData) notFound();

  const profile = profileData as unknown as Profile | null;
  const quiz = quizData as Quiz;
  const questions = (questionsData ?? []) as QuizQuestion[];

  // All previous attempts (most recent first)
  const { data: attemptsData } = await (supabase as any)
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const allAttempts = (attemptsData ?? []) as QuizAttempt[];
  const bestAttempt = allAttempts.reduce<QuizAttempt | null>(
    (best, a) => (!best || a.score > best.score ? a : best), null
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <a href={`/courses/${courseId}`} className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1">
            ← Back to Course
          </a>
          {profile?.role === "founder" && (
            <a
              href={`/admin/courses/${courseId}/quizzes/${quizId}/edit`}
              className="text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit Quiz
            </a>
          )}
        </div>
        <QuizPlayer
          quiz={quiz}
          questions={questions}
          previousBest={bestAttempt}
        />
        {allAttempts.length > 0 && (
          <QuizHistory attempts={allAttempts} quiz={quiz} />
        )}
      </main>
    </div>
  );
}
