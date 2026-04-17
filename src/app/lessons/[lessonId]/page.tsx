import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import GeminiSidebar from "@/components/GeminiSidebar";
import ProgressButton from "@/components/ProgressButton";
import GameLesson from "@/components/GameLesson";
import type { Lesson, Profile, ProgressLog } from "@/lib/types";

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
    supabase.from("lessons").select("*, courses(id, title)").eq("id", lessonId).single(),
  ]);

  if (!lessonData) notFound();

  const profile = profileData as unknown as Profile | null;
  const lesson = lessonData as unknown as Lesson & { courses: { id: string; title: string } };

  const { data: progressData } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const progress = progressData as unknown as ProgressLog | null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar profile={profile} />
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div>
              <a
                href={`/courses/${lesson.course_id}`}
                className="text-sm text-talab-500 hover:text-talab-400 inline-flex items-center gap-1"
              >
                ← Back to Course
              </a>
              <h1 className="text-2xl font-bold text-white mt-3">{lesson.title}</h1>
            </div>

            {lesson.lesson_type === "game" && lesson.game_path ? (
              <GameLesson
                lesson={lesson}
                orgId={profile?.org_id ?? ""}
                existingProgress={progress}
              />
            ) : (
              <>
                {lesson.r2_key && (
                  <VideoPlayer lessonId={lessonId} r2Key={lesson.r2_key} />
                )}
                {lesson.content_body && (
                  <div className="prose prose-invert max-w-none bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div dangerouslySetInnerHTML={{ __html: lesson.content_body }} />
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

        {/* Gemini Sidebar */}
        <GeminiSidebar
          lessonTitle={lesson.title}
          lessonContext={lesson.content_body ?? ""}
        />
      </div>
    </div>
  );
}
