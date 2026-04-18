import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Course, Lesson, Profile, ProgressLog, Quiz, QuizAttempt } from "@/lib/types";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as Profile | null;
  if (profile?.role !== "founder") redirect("/dashboard");

  // Fetch everything in parallel
  const [
    { data: allProfiles },
    { data: allCourses },
    { data: allLessons },
    { data: allProgress },
    { data: allQuizzes },
    { data: allAttempts },
    { data: allOrgs },
  ] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, org_id, created_at"),
    supabase.from("courses").select("id, title, subject_category, is_published, is_free").order("created_at"),
    supabase.from("lessons").select("id, course_id, title, lesson_type"),
    supabase.from("progress_logs").select("*").order("created_at", { ascending: false }),
    (supabase as any).from("quizzes").select("id, course_id, title, pass_score, is_published"),
    (supabase as any).from("quiz_attempts").select("*").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name, subscription_status"),
  ]);

  const profiles = (allProfiles ?? []) as Profile[];
  const courses = (allCourses ?? []) as Course[];
  const lessons = (allLessons ?? []) as Lesson[];
  const progress = (allProgress ?? []) as ProgressLog[];
  const quizzes = (allQuizzes ?? []) as Quiz[];
  const attempts = (allAttempts ?? []) as QuizAttempt[];
  const orgs = (allOrgs ?? []) as { id: string; name: string; subscription_status: string }[];

  const students = profiles.filter((p) => p.role === "student");
  const completions = progress.filter((p) => p.status === "completed");
  const activeOrgs = orgs.filter((o) => o.subscription_status === "active" || o.subscription_status === "trialing");
  const quizPasses = attempts.filter((a) => a.passed);

  // Completions per course
  const completionByCourse: Record<string, number> = {};
  for (const log of completions) {
    const lesson = lessons.find((l) => l.id === log.lesson_id);
    if (lesson) completionByCourse[lesson.course_id] = (completionByCourse[lesson.course_id] ?? 0) + 1;
  }
  const topCourses = courses
    .map((c) => ({ course: c, count: completionByCourse[c.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Quiz pass rates
  const attemptsByQuiz: Record<string, { total: number; passed: number }> = {};
  for (const a of attempts) {
    if (!attemptsByQuiz[a.quiz_id]) attemptsByQuiz[a.quiz_id] = { total: 0, passed: 0 };
    attemptsByQuiz[a.quiz_id].total++;
    if (a.passed) attemptsByQuiz[a.quiz_id].passed++;
  }

  // Recent activity (last 10 completions)
  const recentCompletions = completions.slice(0, 10).map((log) => {
    const student = profiles.find((p) => p.id === log.student_id);
    const lesson = lessons.find((l) => l.id === log.lesson_id);
    const course = courses.find((c) => c.id === lesson?.course_id);
    return { log, student, lesson, course };
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Platform-wide overview</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Students", value: students.length, color: "text-talab-400" },
            { label: "Active subscriptions", value: activeOrgs.length, color: "text-green-400" },
            { label: "Lessons completed", value: completions.length, color: "text-white" },
            { label: "Quizzes passed", value: quizPasses.length, color: "text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top courses by completions */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Most completed courses</h2>
            {topCourses.length === 0 ? (
              <p className="text-gray-500 text-sm">No completions yet.</p>
            ) : (
              <div className="space-y-3">
                {topCourses.map(({ course, count }, i) => {
                  const courseLessons = lessons.filter((l) => l.course_id === course.id).length;
                  const maxPossible = courseLessons * Math.max(students.length, 1);
                  const pct = maxPossible > 0 ? Math.min(Math.round((count / maxPossible) * 100), 100) : 0;
                  return (
                    <div key={course.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300 truncate flex-1 mr-3">
                          <span className="text-gray-600 mr-2">#{i + 1}</span>{course.title}
                        </span>
                        <span className="text-sm font-semibold text-white flex-shrink-0">{count}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className="bg-talab-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quiz pass rates */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Quiz pass rates</h2>
            {quizzes.filter((q) => q.is_published).length === 0 ? (
              <p className="text-gray-500 text-sm">No published quizzes yet.</p>
            ) : (
              <div className="space-y-3">
                {quizzes.filter((q) => q.is_published).map((quiz) => {
                  const stats = attemptsByQuiz[quiz.id] ?? { total: 0, passed: 0 };
                  const pct = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
                  return (
                    <div key={quiz.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300 truncate flex-1 mr-3">{quiz.title}</span>
                        <span className="text-sm font-semibold flex-shrink-0" style={{ color: pct >= 70 ? "#22c55e" : "#94a3b8" }}>
                          {stats.total > 0 ? `${pct}%` : "—"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct >= 70 ? "#22c55e" : "#0ea5e9" }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{stats.total} attempts · {stats.passed} passed</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Organisations */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Families ({orgs.length})</h2>
          {orgs.length === 0 ? (
            <p className="text-gray-500 text-sm">No families yet.</p>
          ) : (
            <div className="space-y-2">
              {orgs.map((org) => {
                const members = students.filter((s) => s.org_id === org.id);
                const orgCompletions = completions.filter((c) =>
                  members.some((m) => m.id === c.student_id)
                ).length;
                return (
                  <div key={org.id} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
                    <div>
                      <p className="text-sm text-white font-medium">{org.name}</p>
                      <p className="text-xs text-gray-500">{members.length} student{members.length !== 1 ? "s" : ""} · {orgCompletions} completions</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      org.subscription_status === "active" || org.subscription_status === "trialing"
                        ? "bg-green-900/20 text-green-400 border-green-800"
                        : "bg-gray-800 text-gray-500 border-gray-700"
                    }`}>
                      {org.subscription_status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Recent completions</h2>
          {recentCompletions.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentCompletions.map(({ log, student, lesson, course }) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-talab-900/50 border border-talab-800 flex items-center justify-center text-xs font-bold text-talab-400 flex-shrink-0">
                      {student?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm text-white">{student?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-gray-500">
                        {lesson?.title ?? "Lesson"} · <span className="text-gray-600">{course?.title ?? ""}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0">
                    {log.completed_at
                      ? new Date(log.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
