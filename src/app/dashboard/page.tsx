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
    color: "from-pink-600 to-rose-600",
    border: "border-pink-800/50 hover:border-pink-600",
    badge: "bg-pink-900/30 text-pink-300",
  },
  {
    key: "ks1",
    label: "Key Stage 1",
    ages: "Ages 5–7 · Years 1–2",
    icon: "📗",
    color: "from-talab-600 to-blue-600",
    border: "border-talab-800/50 hover:border-talab-500",
    badge: "bg-talab-900/30 text-talab-300",
  },
  {
    key: "ks2",
    label: "Key Stage 2",
    ages: "Ages 7–11 · Years 3–6",
    icon: "📘",
    color: "from-violet-600 to-purple-600",
    border: "border-violet-800/50 hover:border-violet-500",
    badge: "bg-violet-900/30 text-violet-300",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
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
    ? supabase.from("courses").select("key_stage, id").order("created_at")
    : supabase.from("courses").select("key_stage, id").eq("is_published", true).order("created_at");
  const { data: rawCourses } = await query;
  const courses = (rawCourses as unknown as Pick<Course, "id" | "key_stage">[]) ?? [];

  const countByTier: Record<string, number> = {};
  courses.forEach((c) => { countByTier[c.key_stage] = (countByTier[c.key_stage] ?? 0) + 1; });

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isFounder ? "All Courses" : "My Curriculum"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Choose a stage to get started</p>
          </div>
          {isFounder && (
            <a href="/admin/courses/new" className="px-4 py-2 bg-talab-600 hover:bg-talab-700 text-white text-sm font-medium rounded-lg transition-colors">
              + New Course
            </a>
          )}
        </div>

        {!isFounder && !hasActiveSubscription && (
          <div className="mb-8 bg-amber-900/20 border border-amber-800/50 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-300 font-medium text-sm">No active subscription</p>
              <p className="text-amber-400/70 text-xs mt-0.5">KS2 courses are premium. Subscribe to unlock them.</p>
            </div>
            <a href="/billing" className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors">
              View Plans
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const count = countByTier[tier.key] ?? 0;
            return (
              <Link
                key={tier.key}
                href={`/dashboard/${tier.key}`}
                className={`group relative bg-gray-900 border rounded-2xl p-6 transition-all duration-200 ${tier.border}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl mb-4`}>
                  {tier.icon}
                </div>
                <h2 className="text-lg font-bold text-white group-hover:text-talab-300 transition-colors">
                  {tier.label}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{tier.ages}</p>
                <p className="text-xs text-gray-600 mt-3">
                  {count} subject{count !== 1 ? "s" : ""}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm text-talab-500 font-medium group-hover:text-talab-400">
                  Enter stage
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
