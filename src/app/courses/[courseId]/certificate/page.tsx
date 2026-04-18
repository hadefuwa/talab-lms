import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import CertificateView from "@/components/CertificateView";
import type { Course, Lesson, Profile, ProgressLog } from "@/lib/types";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: courseData }, { data: lessonsData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("courses").select("*").eq("id", courseId).single(),
    supabase.from("lessons").select("id").eq("course_id", courseId),
  ]);

  if (!courseData) notFound();

  const profile = profileData as unknown as Profile | null;
  const course = courseData as unknown as Course;
  const lessonIds = ((lessonsData as unknown as Lesson[]) ?? []).map((l) => l.id);

  if (lessonIds.length === 0) redirect(`/courses/${courseId}`);

  const { data: progressData } = await supabase
    .from("progress_logs")
    .select("lesson_id, status, completed_at")
    .eq("student_id", user.id)
    .in("lesson_id", lessonIds);

  const logs = (progressData as unknown as ProgressLog[]) ?? [];
  const completedIds = new Set(logs.filter((l) => l.status === "completed").map((l) => l.lesson_id));

  // Must have completed all lessons
  if (completedIds.size < lessonIds.length) {
    redirect(`/courses/${courseId}`);
  }

  const completedDates = logs
    .filter((l) => l.completed_at)
    .map((l) => new Date(l.completed_at!).getTime());
  const completionDate = completedDates.length > 0
    ? new Date(Math.max(...completedDates))
    : new Date();

  return (
    <CertificateView
      studentName={profile?.full_name ?? "Student"}
      courseTitle={course.title}
      subjectCategory={course.subject_category}
      completionDate={completionDate}
      courseId={courseId}
    />
  );
}
