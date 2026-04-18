import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Course, Organization, Profile } from "@/lib/types";

const TIERS = [
  {
    key: "nursery",
    label: "Nursery & Reception",
    ages: "Ages 3–5",
    icon: "🌱",
    bg: "bg-pink-500",
    light: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-100 hover:border-pink-300 hover:shadow-pink-100",
  },
  {
    key: "ks1",
    label: "Key Stage 1",
    ages: "Ages 5–7 · Years 1–2",
    icon: "📗",
    bg: "bg-talab-600",
    light: "bg-talab-50",
    text: "text-talab-600",
    border: "border-talab-100 hover:border-talab-300 hover:shadow-talab-100",
  },
  {
    key: "ks2",
    label: "Key Stage 2",
    ages: "Ages 7–11 · Years 3–6",
    icon: "📘",
    bg: "bg-violet-600",
    light: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100 hover:border-violet-300 hover:shadow-violet-100",
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

  const query = isFounder
    ? supabase.from("courses").select("key_stage, id")
    : supabase.from("courses").select("key_stage, id").eq("is_published", true);
  const { data: rawCourses } = await query;
  const courses = (rawCourses as unknown as Pick<Course, "id" | "key_stage">[]) ?? [];
  const countByTier: Record<string, number> = {};
  courses.forEach((c) => { countByTier[c.key_stage] = (countByTier[c.key_stage] ?? 0) + 1; });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              {isFounder ? "All Courses" : `Hello, ${profile?.full_name?.split(" ")[0] ?? "there"} 👋`}
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
            return (
              <Link
                key={tier.key}
                href={`/dashboard/${tier.key}`}
                className={`group bg-white border-2 rounded-2xl p-6 transition-all duration-200 shadow-card hover:shadow-card-hover ${tier.border}`}
              >
                <div className={`w-12 h-12 ${tier.bg} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm`}>
                  {tier.icon}
                </div>
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-slate-900">{tier.label}</h2>
                <p className="text-sm text-slate-400 mt-1">{tier.ages}</p>
                <p className={`text-xs font-semibold mt-4 ${tier.text}`}>
                  {count} subject{count !== 1 ? "s" : ""} →
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
