import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import LessonForm from "@/components/LessonForm";
import type { Lesson, Profile } from "@/lib/types";

interface Props {
  params: Promise<{ lessonId: string }>;
}

export default async function EditLessonPage({ params }: Props) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as Profile | null;
  if (profile?.role !== "founder") redirect("/dashboard");

  const { data: lessonData } = await supabase
    .from("lessons").select("*").eq("id", lessonId).single();
  if (!lessonData) notFound();
  const lesson = lessonData as unknown as Lesson;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <a href={`/courses/${lesson.course_id}`} className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1 mb-6">
          ← Back to Course
        </a>
        <h1 className="text-2xl font-bold text-white mb-8">Edit Lesson</h1>
        <LessonForm courseId={lesson.course_id} lesson={lesson} />
      </main>
    </div>
  );
}
