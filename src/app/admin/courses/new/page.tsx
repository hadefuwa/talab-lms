import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CourseForm from "@/components/CourseForm";
import type { Profile } from "@/lib/types";

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  const typedProfile = profile as Profile | null;
  if (typedProfile?.role !== "founder") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={typedProfile} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">New Course</h1>
        <CourseForm />
      </main>
    </div>
  );
}
