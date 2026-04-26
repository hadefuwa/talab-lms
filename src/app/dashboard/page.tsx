import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Course, Organization, Profile } from "@/lib/types";

const TIERS = [
  {
    key: "nursery",
    label: "Nursery & Reception",
    ages: "Ages 3-5",
    icon: "N",
    bg: "bg-pink-500",
    bar: "bg-pink-400",
    text: "text-pink-600",
    border: "border-pink-100 hover:border-pink-300",
  },
  {
    key: "ks1",
    label: "Key Stage 1",
    ages: "Ages 5-7 | Years 1-2",
    icon: "1",
    bg: "bg-talab-600",
    bar: "bg-talab-500",
    text: "text-talab-600",
    border: "border-talab-100 hover:border-talab-300",
  },
  {
    key: "ks2",
    label: "Key Stage 2",
    ages: "Ages 7-11 | Years 3-6",
    icon: "2",
    bg: "bg-violet-600",
    bar: "bg-violet-500",
    text: "text-violet-600",
    border: "border-violet-100 hover:border-violet-300",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as Profile | null;
  const isFounder = profile?.role === "founder";

  let hasActiveSubscription = false;
  if (profile?.org_id) {
    const { data: orgData } = await supabase
      .from("organizations").select("subscription_status").eq("id", profile.org_id).single();
    const org = orgData as unknown as Organization | null;
    hasActiveSubscription = org?.subscription_status === "active" || org?.subscription_status === "trialing";
  }

  const { data: rawCourses } = await (isFounder
    ? supabase.from("courses").select("key_stage, id")
    : supabase.from("courses").select("key_stage, id").eq("is_published", true));
  const courses = (rawCourses as unknown as Pick<Course, "id" | "key_stage">[]) ?? [];

  const tierProgress: Record<string, { total: number; completed: number }> = {};
  if (courses.length > 0) {
    const courseIds = courses.map((c) => c.id);
    const [{ data: lessonRows }, { data: progressRows }] = await Promise.all([
      supabase.from("lessons").select("id, course_id").in("course_id", courseIds),
      supabase.from("progress_logs").select("lesson_id, status").eq("student_id", user.id),
    ]);

    const lessonToCourse: Record<string, string> = {};
    const courseTier: Record<string, string> = {};
    courses.forEach((c) => { courseTier[c.id] = c.key_stage; });
    (lessonRows ?? []).forEach((r: { id: string; course_id: string }) => {
      lessonToCourse[r.id] = r.course_id;
      const tier = courseTier[r.course_id];
      if (tier) {
        tierProgress[tier] = tierProgress[tier] ?? { total: 0, completed: 0 };
        tierProgress[tier].total++;
      }
    });

    const completedIds = new Set(
      (progressRows ?? [])
        .filter((r: { status: string }) => r.status === "completed")
        .map((r: { lesson_id: string }) => r.lesson_id)
    );
    completedIds.forEach((lid) => {
      const cid = lessonToCourse[lid];
      const tier = cid ? courseTier[cid] : null;
      if (tier && tierProgress[tier]) tierProgress[tier].completed++;
    });
  }

  const countByTier: Record<string, number> = {};
  courses.forEach((c) => { countByTier[c.key_stage] = (countByTier[c.key_stage] ?? 0) + 1; });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              {isFounder ? "All Courses" : `Hello, ${profile?.full_name?.split(" ")[0] ?? "there"}`}
            </h1>
            <p className="text-slate-500 mt-1">Choose a stage to explore</p>
          </div>
          {isFounder && (
            <a href="/admin/courses/new" className="px-4 py-2 bg-talab-600 hover:bg-talab-700 text-white text-sm font-semibold rounded-xl transition-colors">
              + New Course
            </a>
          )}
        </div>

        {!isFounder && !hasActiveSubscription && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-800 font-semibold text-sm">KS2 courses require a subscription</p>
              <p className="text-amber-600 text-xs mt-0.5">Nursery and KS1 are always free.</p>
            </div>
            <a href="/billing" className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors">
              View Plans
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TIERS.map((tier) => {
            const count = countByTier[tier.key] ?? 0;
            const prog = tierProgress[tier.key] ?? { total: 0, completed: 0 };
            const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
            const allDone = prog.total > 0 && prog.completed === prog.total;
            const isDisabled = !isFounder && count === 0;
            const cardClassName = `group bg-white border-2 rounded-2xl p-6 transition-all duration-200 shadow-card ${
              isDisabled
                ? "border-slate-200 opacity-70 cursor-not-allowed"
                : `${tier.border} hover:shadow-card-hover`
            }`;
            const cardContent = (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${isDisabled ? "bg-slate-300" : tier.bg} rounded-2xl flex items-center justify-center text-2xl text-white font-black shadow-sm`}>
                    {tier.icon}
                  </div>
                  {isDisabled ? (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Coming soon
                    </span>
                  ) : allDone ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Complete
                    </span>
                  ) : null}
                </div>
                <h2 className={`text-lg font-bold ${isDisabled ? "text-slate-500" : "text-slate-800 group-hover:text-slate-900"}`}>
                  {tier.label}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">{tier.ages}</p>
                <p className={`text-xs mt-1 ${isDisabled ? "text-slate-500 font-semibold" : "text-slate-400"}`}>
                  {isDisabled ? "No subjects available yet" : `${count} subject${count !== 1 ? "s" : ""}`}
                </p>

                {!isFounder && !isDisabled && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{prog.completed}/{prog.total} lessons</span>
                      <span className={`font-bold ${pct === 100 ? "text-green-600" : tier.text}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pct === 100 ? "bg-green-500" : tier.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className={`text-xs font-semibold mt-3 ${isDisabled ? "text-slate-400" : tier.text}`}>
                  {isDisabled ? "Unavailable" : "Explore"}
                </p>
              </>
            );

            if (isDisabled) {
              return (
                <div
                  key={tier.key}
                  className={cardClassName}
                  aria-disabled="true"
                  title="Coming soon"
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={tier.key}
                href={`/dashboard/${tier.key}`}
                className={cardClassName}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
