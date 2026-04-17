import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Profile } from "@/lib/types";
import Link from "next/link";

export default async function BillingSuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  const profile = profileData as unknown as Profile | null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-white mb-2">Subscription Active!</h1>
        <p className="text-gray-400 mb-8">
          Your family now has full access to the Talab curriculum.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-talab-600 hover:bg-talab-700 text-white font-medium rounded-xl transition-colors"
        >
          Go to Dashboard
        </Link>
      </main>
    </div>
  );
}
