import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-talab-600 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">T</div>
          <span className="font-bold text-lg">Talab</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-black leading-tight">
            Learning that<br />grows with your child.
          </h1>
          <p className="text-talab-100 text-lg leading-relaxed">
            A curriculum built for homeschool families — from Nursery all the way through Key Stage 2.
          </p>
          <div className="flex flex-col gap-3">
            {["Nursery & Reception", "Key Stage 1 (Years 1–2)", "Key Stage 2 (Years 3–6)"].map((stage) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-talab-100 text-sm">{stage}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-talab-200 text-sm">talab.space</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2 lg:hidden">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-talab-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">T</div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Talab LMS</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8 space-y-6 border border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to access your curriculum.</p>
            </div>
            <LoginButton />
          </div>

          <p className="text-center text-xs text-slate-400">
            Access is by invitation only. Contact the Founder to get started.
          </p>
        </div>
      </div>
    </main>
  );
}
