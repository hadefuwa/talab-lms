import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import LessonList from "@/components/LessonList";
import type { Course, Lesson, Profile, ProgressLog } from "@/lib/types";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: courseData }, { data: lessonsData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("courses").select("*").eq("id", courseId).single(),
    supabase.from("lessons").select("*").eq("course_id", courseId).order("position"),
  ]);

  if (!courseData) notFound();

  const profile = profileData as unknown as Profile | null;
  const course = courseData as unknown as Course;
  const lessons = (lessonsData as unknown as Lesson[]) ?? [];

  const { data: progressData } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("student_id", user.id)
    .in("lesson_id", lessons.map((l) => l.id));

  const progressLogs = (progressData as unknown as ProgressLog[]) ?? [];
  const progressMap: Record<string, string> = Object.fromEntries(
    progressLogs.map((p) => [p.lesson_id, p.status])
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <a href="/dashboard" className="text-sm text-talab-500 hover:text-talab-400 mb-4 inline-flex items-center gap-1">
            ← Back to Dashboard
          </a>
          <div className="mt-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-talab-400 bg-talab-900/30 px-2 py-1 rounded">
                {course.subject_category}
              </span>
              <h1 className="text-3xl font-bold text-white mt-2">{course.title}</h1>
              {course.description && (
                <p className="text-gray-400 mt-2">{course.description}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{lessons.length} lessons</span>
            <span>{Object.values(progressMap).filter((s) => s === "completed").length} completed</span>
            {profile?.role === "founder" && (
              <a
                href={`/admin/courses/${courseId}/lessons/new`}
                className="text-talab-500 hover:text-talab-400 font-medium"
              >
                + Add Lesson
              </a>
            )}
          </div>
        </div>

        <LessonList lessons={lessons} courseId={courseId} progressMap={progressMap} />
      </main>
    </div>
  );
}
