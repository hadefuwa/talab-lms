import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "founder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lessonId, direction } = await req.json();

  // Get the lesson and its siblings
  const { data: lesson } = await supabase
    .from("lessons").select("id, course_id, position").eq("id", lessonId).single();
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: siblings } = await supabase
    .from("lessons")
    .select("id, position")
    .eq("course_id", (lesson as any).course_id)
    .order("position");

  const items = (siblings ?? []) as { id: string; position: number }[];
  const idx = items.findIndex((l) => l.id === lessonId);

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) {
    return NextResponse.json({ ok: true }); // already at boundary
  }

  const swapLesson = items[swapIdx];

  // Swap positions
  await Promise.all([
    supabase.from("lessons").update({ position: swapLesson.position }).eq("id", lessonId),
    supabase.from("lessons").update({ position: (lesson as any).position }).eq("id", swapLesson.id),
  ]);

  return NextResponse.json({ ok: true });
}
