import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LessonForm from "@/components/LessonForm";
import type { Course, Profile } from "@/lib/types";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function NewLessonPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  const profile = profileData as unknown as Profile | null;
  if (profile?.role !== "founder") redirect("/dashboard");

  const { data: courseData } = await supabase
    .from("courses").select("*").eq("id", courseId).single();

  if (!courseData) redirect("/dashboard");
  const course = courseData as unknown as Course;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <a href={`/courses/${courseId}`} className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1 mb-6">
          ← Back to {course.title}
        </a>
        <h1 className="text-2xl font-bold text-white mb-8">New Lesson</h1>
        <LessonForm courseId={courseId} />
      </main>
    </div>
  );
}
