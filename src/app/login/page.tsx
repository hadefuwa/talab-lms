import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-talab-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-talab-600/30">
              T
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Talab LMS</h1>
          <p className="text-gray-400 text-sm">
            Secure curriculum platform — fast at the edge, safe at the database.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Sign in</h2>
            <p className="text-sm text-gray-400 mt-1">
              Use your Google account to access your curriculum.
            </p>
          </div>
          <LoginButton />
        </div>

        <p className="text-center text-xs text-gray-600">
          Access is by invitation only. Contact the Founder to get started.
        </p>
      </div>
    </main>
  );
}
