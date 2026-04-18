"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile | null;
}

export default function Navbar({ profile }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Courses" },
    { href: "/progress", label: "My Progress" },
    ...(profile?.role !== "student" ? [{ href: "/family", label: "Family" }] : []),
    ...(profile?.role !== "student" ? [{ href: "/billing", label: "Billing" }] : []),
    ...(profile?.role === "founder" ? [{ href: "/admin/analytics", label: "Analytics" }] : []),
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Logo + desktop links */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 bg-talab-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">T</div>
              <span className="font-semibold text-white text-sm">Talab LMS</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === link.href
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {profile?.role === "founder" && (
              <span className="text-xs bg-talab-900/50 text-talab-400 border border-talab-800 px-2 py-0.5 rounded-full hidden sm:inline">
                Founder
              </span>
            )}
            {profile && (
              <div className="hidden sm:flex items-center gap-2">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name} width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300">
                    {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-sm text-gray-300">{profile.full_name}</span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 hidden sm:block"
            >
              Sign out
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 space-y-1">
          {/* User info */}
          {profile && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 border-b border-gray-800 pb-3">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.full_name} width={32} height={32} className="rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-300">
                  {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{profile.full_name}</p>
                {profile.role === "founder" && (
                  <p className="text-xs text-talab-400">Founder</p>
                )}
              </div>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block text-sm px-3 py-2.5 rounded-xl transition-colors ${
                pathname === link.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm px-3 py-2.5 text-red-500 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-colors mt-1"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
