import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "founder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await (supabase as any).from("quiz_attempts").delete().eq("quiz_id", quizId);
  await (supabase as any).from("quiz_questions").delete().eq("quiz_id", quizId);
  const { error } = await (supabase as any).from("quizzes").delete().eq("id", quizId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
