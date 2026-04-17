import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CourseCard from "@/components/CourseCard";
import Navbar from "@/components/Navbar";
import type { Course, Profile } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile | null;
  const isFounder = profile?.role === "founder";

  let courses: Course[] = [];
  if (isFounder) {
    const { data } = await supabase.from("courses").select("*").order("created_at");
    courses = (data as unknown as Course[]) ?? [];
  } else {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at");
    courses = (data as unknown as Course[]) ?? [];
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isFounder ? "All Courses" : "My Curriculum"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {courses.length} course{courses.length !== 1 ? "s" : ""} available
            </p>
          </div>
          {isFounder && (
            <a
              href="/admin/courses/new"
              className="px-4 py-2 bg-talab-600 hover:bg-talab-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Course
            </a>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-white mb-2">No courses yet</h2>
            <p className="text-gray-400">
              {isFounder
                ? "Create your first course to get started."
                : "Check back soon — your founder is building your curriculum."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
