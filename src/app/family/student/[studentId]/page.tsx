import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Course, Lesson, Profile, ProgressLog } from "@/lib/types";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function StudentProgressPage({ params }: Props) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as Profile | null;

  if (profile?.role === "student") redirect("/dashboard");

  const { data: studentData } = await supabase
    .from("profiles").select("*").eq("id", studentId).single();
  if (!studentData) notFound();
  const student = studentData as unknown as Profile;

  // Ensure same org
  if (student.org_id !== profile?.org_id && profile?.role !== "founder") {
    redirect("/family");
  }

  const { data: progressData } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("student_id", studentId);

  const logs = (progressData as unknown as ProgressLog[]) ?? [];
  const completedLessonIds = new Set(
    logs.filter((l) => l.status === "completed").map((l) => l.lesson_id)
  );

  const { data: coursesData } = await supabase
    .from("courses").select("*").eq("is_published", true);
  const courses = (coursesData as unknown as Course[]) ?? [];

  const courseProgress: Array<{
    course: Course;
    lessons: Lesson[];
    completed: number;
  }> = [];

  for (const course of courses) {
    const { data: lessonsData } = await supabase
      .from("lessons").select("*").eq("course_id", course.id).order("position");
    const lessons = (lessonsData as unknown as Lesson[]) ?? [];
    const completed = lessons.filter((l) => completedLessonIds.has(l.id)).length;
    courseProgress.push({ course, lessons, completed });
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <a href="/family" className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1 mb-6">
          ← Back to Family
        </a>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-talab-900/50 border border-talab-800 flex items-center justify-center text-lg font-bold text-talab-400">
            {student.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{student.full_name}</h1>
            <p className="text-gray-400 text-sm">
              {completedLessonIds.size} lessons completed across {courses.length} courses
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {courseProgress.map(({ course, lessons, completed }) => {
            const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
            return (
              <div key={course.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium">{course.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{course.subject_category}</p>
                  </div>
                  <span className="text-sm font-semibold text-talab-400">{pct}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-talab-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {completed} / {lessons.length} lessons
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
