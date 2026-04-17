import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "founder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all lesson IDs for this course
  const { data: lessons } = await supabase
    .from("lessons").select("id").eq("course_id", courseId);
  const lessonIds = (lessons ?? []).map((l: any) => l.id);

  if (lessonIds.length > 0) {
    // Delete progress logs
    await supabase.from("progress_logs").delete().in("lesson_id", lessonIds);
  }

  // Get quiz IDs for this course
  const { data: quizzes } = await (supabase as any)
    .from("quizzes").select("id").eq("course_id", courseId);
  const quizIds = (quizzes ?? []).map((q: any) => q.id);

  if (quizIds.length > 0) {
    await (supabase as any).from("quiz_attempts").delete().in("quiz_id", quizIds);
    await (supabase as any).from("quiz_questions").delete().in("quiz_id", quizIds);
    await (supabase as any).from("quizzes").delete().in("id", quizIds);
  }

  // Delete lessons then course
  if (lessonIds.length > 0) {
    await supabase.from("lessons").delete().in("id", lessonIds);
  }
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
