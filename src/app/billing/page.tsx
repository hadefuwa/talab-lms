import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BillingPanel from "@/components/BillingPanel";
import type { Organization, Profile } from "@/lib/types";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile & { organizations: Organization | null };

  if (profile.role === "student") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Billing</h1>
        <BillingPanel profile={profile} org={(profile as any).organizations} />
      </main>
    </div>
  );
}
