import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, score, orgId } = await req.json();
  if (!lessonId || score == null) {
    return NextResponse.json({ error: "Missing lessonId or score" }, { status: 400 });
  }

  // Fetch the lesson's pass score
  const { data: lesson } = await (supabase as any)
    .from("lessons")
    .select("game_pass_score")
    .eq("id", lessonId)
    .single();

  const passScore = lesson?.game_pass_score ?? 5;
  const passed = score >= passScore;
  const newStatus = passed ? "completed" : "in_progress";

  // Upsert — only upgrade status, never downgrade. Always update best score.
  const { data: existing } = await supabase
    .from("progress_logs")
    .select("id, status, game_score")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const existingScore = (existing as any)?.game_score ?? 0;
  const bestScore = Math.max(existingScore, score);
  const finalStatus =
    (existing as any)?.status === "completed" ? "completed" : newStatus;

  if (existing) {
    await supabase
      .from("progress_logs")
      .update({ status: finalStatus, game_score: bestScore, completed_at: passed ? new Date().toISOString() : null })
      .eq("id", (existing as any).id);
  } else {
    await (supabase as any)
      .from("progress_logs")
      .insert({
        student_id: user.id,
        lesson_id: lessonId,
        org_id: orgId ?? null,
        status: finalStatus,
        game_score: bestScore,
        completed_at: passed ? new Date().toISOString() : null,
      });
  }

  return NextResponse.json({ passed, score, passScore, bestScore });
}
