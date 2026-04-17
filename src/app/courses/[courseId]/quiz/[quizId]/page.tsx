import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuizPlayer from "@/components/QuizPlayer";
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

  // Best previous attempt
  const { data: bestAttempt } = await (supabase as any)
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("student_id", user.id)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <a href={`/courses/${courseId}`} className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1 mb-6">
          ← Back to Course
        </a>
        <QuizPlayer
          quiz={quiz}
          questions={questions}
          previousBest={bestAttempt as QuizAttempt | null}
        />
      </main>
    </div>
  );
}
