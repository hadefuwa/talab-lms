import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuizBuilder from "@/components/QuizBuilder";
import type { Profile, Quiz, QuizQuestion } from "@/lib/types";

interface Props {
  params: Promise<{ courseId: string; quizId: string }>;
}

export default async function EditQuizPage({ params }: Props) {
  const { courseId, quizId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as Profile | null;
  if (profile?.role !== "founder") redirect("/dashboard");

  const [{ data: quizData }, { data: questionsData }] = await Promise.all([
    (supabase as any).from("quizzes").select("*").eq("id", quizId).single(),
    (supabase as any).from("quiz_questions").select("*").eq("quiz_id", quizId).order("position"),
  ]);

  if (!quizData) notFound();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <a href={`/courses/${courseId}`} className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1 mb-6">
          ← Back to Course
        </a>
        <h1 className="text-2xl font-bold text-white mb-8">Edit Quiz</h1>
        <QuizBuilder
          courseId={courseId}
          quiz={quizData as Quiz}
          existingQuestions={(questionsData ?? []) as QuizQuestion[]}
        />
      </main>
    </div>
  );
}
