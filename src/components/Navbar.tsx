"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile | null;
}

export default function Navbar({ profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-talab-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
              T
            </div>
            <span className="font-semibold text-white text-sm">Talab LMS</span>
          </Link>

          <div className="flex items-center gap-3">
            {profile?.role === "founder" && (
              <span className="text-xs bg-talab-900/50 text-talab-400 border border-talab-800 px-2 py-0.5 rounded-full">
                Founder
              </span>
            )}
            {profile && (
              <div className="flex items-center gap-2">
                {(profile as any).avatar_url ? (
                  <Image
                    src={(profile as any).avatar_url}
                    alt={profile.full_name}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300">
                    {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-sm text-gray-300 hidden sm:block">{profile.full_name}</span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
