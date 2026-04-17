import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, orgId, status } = await request.json();

  if (!lessonId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("progress_logs")
    .upsert(
      {
        student_id: user.id,
        lesson_id: lessonId,
        org_id: orgId || null,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      },
      { onConflict: "student_id,lesson_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
