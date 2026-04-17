import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import FamilyManager from "@/components/FamilyManager";
import type { Organization, Profile } from "@/lib/types";

export default async function FamilyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  const profile = profileData as unknown as Profile | null;
  if (profile?.role === "student") redirect("/dashboard");

  let org: Organization | null = null;
  let members: Profile[] = [];

  if (profile?.org_id) {
    const [{ data: orgData }, { data: membersData }] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
      supabase.from("profiles").select("*").eq("org_id", profile.org_id),
    ]);
    org = orgData as unknown as Organization | null;
    members = (membersData as unknown as Profile[]) ?? [];
  }

  // Fetch progress summary for each student member
  const students = members.filter((m) => m.role === "student");
  const progressSummary: Record<string, number> = {};

  for (const student of students) {
    const { count } = await (supabase as any)
      .from("progress_logs")
      .select("*", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("status", "completed");
    progressSummary[student.id] = count ?? 0;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Family</h1>
        <FamilyManager
          profile={profile}
          org={org}
          members={members}
          progressSummary={progressSummary}
        />
      </main>
    </div>
  );
}
