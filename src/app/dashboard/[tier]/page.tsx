import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import CourseGrid from "@/components/CourseGrid";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Course, Organization, Profile } from "@/lib/types";

const TIER_META: Record<string, { label: string; ages: string; icon: string; color: string }> = {
  nursery: { label: "Nursery & Reception", ages: "Ages 3–5", icon: "🌱", color: "bg-pink-500" },
  ks1:     { label: "Key Stage 1",         ages: "Ages 5–7 · Years 1–2", icon: "📗", color: "bg-talab-600" },
  ks2:     { label: "Key Stage 2",         ages: "Ages 7–11 · Years 3–6", icon: "📘", color: "bg-violet-600" },
};

interface Props {
  params: Promise<{ tier: string }>;
}

export default async function TierPage({ params }: Props) {
  const { tier } = await params;
  if (!TIER_META[tier]) notFound();

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

  const query = isFounder
    ? supabase.from("courses").select("*").eq("key_stage", tier).order("subject_category")
    : supabase.from("courses").select("*").eq("is_published", true).eq("key_stage", tier).order("subject_category");
  const { data: rawCourses } = await query;
  const baseCourses = (rawCourses as unknown as Course[]) ?? [];

  let courses: Course[] = baseCourses;
  if (baseCourses.length > 0) {
    const ids = baseCourses.map((c) => c.id);
    const [{ data: lessonCounts }, { data: quizCounts }] = await Promise.all([
      supabase.from("lessons").select("course_id").in("course_id", ids),
      (supabase as any).from("quizzes").select("course_id").in("course_id", ids),
    ]);
    const lc: Record<string, number> = {};
    const qc: Record<string, number> = {};
    (lessonCounts ?? []).forEach((r: { course_id: string }) => { lc[r.course_id] = (lc[r.course_id] ?? 0) + 1; });
    (quizCounts ?? []).forEach((r: { course_id: string }) => { qc[r.course_id] = (qc[r.course_id] ?? 0) + 1; });
    courses = baseCourses.map((c) => ({ ...c, lessonCount: lc[c.id] ?? 0, quizCount: qc[c.id] ?? 0 }));
  }

  const meta = TIER_META[tier];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-talab-600 hover:text-talab-700 font-medium inline-flex items-center gap-1 mb-5">
            ← All Stages
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${meta.color} rounded-2xl flex items-center justify-center text-3xl shadow-sm`}>
                {meta.icon}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800">{meta.label}</h1>
                <p className="text-slate-400 text-sm mt-0.5">{meta.ages}</p>
              </div>
            </div>
            {isFounder && (
              <a href="/admin/courses/new" className="px-4 py-2 bg-talab-600 hover:bg-talab-700 text-white text-sm font-semibold rounded-xl transition-colors">
                + New Course
              </a>
            )}
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">No courses yet</h2>
            <p className="text-slate-400">
              {isFounder ? "Create your first course for this stage." : "Check back soon — content is being added."}
            </p>
          </div>
        ) : (
          <CourseGrid courses={courses} isFounder={isFounder} hasAccess={isFounder || hasActiveSubscription} />
        )}
      </main>
    </div>
  );
}
