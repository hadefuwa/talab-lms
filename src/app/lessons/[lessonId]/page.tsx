import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import GeminiSidebar from "@/components/GeminiSidebar";
import ProgressButton from "@/components/ProgressButton";
import GameLesson from "@/components/GameLesson";
import InteractiveLessonPlayer from "@/components/InteractiveLessonPlayer";
import TTSButton from "@/components/TTSButton";
import type { Course, Lesson, Organization, Profile, ProgressLog } from "@/lib/types";

interface Props {
  params: Promise<{ lessonId: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: lessonData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lessons").select("*, courses(id, title, is_free)").eq("id", lessonId).single(),
  ]);

  if (!lessonData) notFound();

  const profile = profileData as unknown as Profile | null;
  const lesson = lessonData as unknown as Lesson & { courses: { id: string; title: string; is_free: boolean } };
  const isGameLesson = lesson.lesson_type === "game";

  if (profile?.role !== "founder" && !lesson.courses.is_free) {
    let hasAccess = false;
    if (profile?.org_id) {
      const { data: orgData } = await supabase
        .from("organizations").select("subscription_status").eq("id", profile.org_id).single();
      const org = orgData as unknown as Organization | null;
      hasAccess = org?.subscription_status === "active" || org?.subscription_status === "trialing";
    }
    if (!hasAccess) redirect("/billing");
  }

  const { data: progressData } = await supabase
    .from("progress_logs").select("*").eq("student_id", user.id).eq("lesson_id", lessonId).maybeSingle();
  const progress = progressData as unknown as ProgressLog | null;

  const { data: nextLessonData } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", lesson.course_id)
    .gt("position", lesson.position)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  const nextLessonId = (nextLessonData as { id: string } | null)?.id ?? null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={profile} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className={`${isGameLesson ? "max-w-7xl" : "max-w-4xl"} mx-auto px-4 sm:px-6 py-8 space-y-6`}>
            <div>
              <div className="flex items-center justify-between">
                <a href={`/courses/${lesson.course_id}`} className="text-sm text-talab-600 hover:text-talab-700 font-medium inline-flex items-center gap-1">
                  ← Back to Course
                </a>
                {profile?.role === "founder" && (
                  <a
                    href={`/admin/lessons/${lessonId}/edit`}
                    className="text-xs text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Edit Lesson
                  </a>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-800 mt-3">{lesson.title}</h1>
            </div>

            {lesson.lesson_type === "interactive" && (lesson.content_path || lesson.content_body) ? (
              <InteractiveLessonPlayer
                lesson={lesson}
                orgId={profile?.org_id ?? ""}
                existingProgress={progress}
                nextLessonId={nextLessonId}
              />
            ) : lesson.lesson_type === "game" && lesson.game_path ? (
              <GameLesson lesson={lesson} orgId={profile?.org_id ?? ""} existingProgress={progress} />
            ) : (
              <>
                {lesson.r2_key && <VideoPlayer lessonId={lessonId} r2Key={lesson.r2_key} />}
                {lesson.content_body && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-4">
                    <TTSButton
                      text={lesson.content_body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
                      size="lg"
                    />
                    <div className="prose prose-slate max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: lesson.content_body }} />
                    </div>
                  </div>
                )}
                <ProgressButton
                  lessonId={lessonId}
                  orgId={profile?.org_id ?? ""}
                  currentStatus={progress?.status ?? "not_started"}
                />
              </>
            )}
          </div>
        </main>
        {!isGameLesson && (
          <GeminiSidebar lessonTitle={lesson.title} lessonContext={lesson.content_body ?? ""} />
        )}
      </div>
    </div>
  );
}
