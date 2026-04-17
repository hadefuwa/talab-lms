import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId, answers } = await request.json();
  if (!quizId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: profileData } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  const orgId = (profileData as any)?.org_id ?? null;

  const { data: questionsData } = await (supabase as any)
    .from("quiz_questions")
    .select("id, correct_index")
    .eq("quiz_id", quizId)
    .order("position");

  const questions = (questionsData ?? []) as { id: string; correct_index: number }[];
  const maxScore = questions.length;
  const score = questions.reduce(
    (acc: number, q: any, idx: number) =>
      answers[idx] === q.correct_index ? acc + 1 : acc,
    0
  );

  const { data: quiz } = await (supabase as any)
    .from("quizzes").select("pass_score").eq("id", quizId).single();

  const passed = maxScore > 0 && (score / maxScore) * 100 >= (quiz?.pass_score ?? 70);

  const { data: attempt, error } = await (supabase as any)
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, student_id: user.id, org_id: orgId, score, max_score: maxScore, passed, answers })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ attempt, score, maxScore, passed });
}
