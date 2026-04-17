"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Organization, Profile } from "@/lib/types";

interface Props {
  profile: Profile | null;
  org: Organization | null;
  members: Profile[];
  progressSummary: Record<string, number>;
}

export default function FamilyManager({ profile, org, members, progressSummary }: Props) {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/family/create-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
    } else {
      setMessage({ type: "success", text: "Family created!" });
      router.refresh();
    }
    setLoading(false);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/family/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, name: inviteName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
    } else {
      setMessage({ type: "success", text: "Invite sent successfully!" });
      setInviteEmail("");
      setInviteName("");
      router.refresh();
    }
    setLoading(false);
  }

  const students = members.filter((m) => m.role === "student");

  // No org yet — show create form
  if (!org) {
    return (
      <div className="max-w-md">
        <p className="text-gray-400 text-sm mb-6">
          Create a family to manage your students and track their progress.
        </p>
        <form onSubmit={createOrg} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {message && (
            <div className={`text-sm px-3 py-2 rounded-lg border ${message.type === "error" ? "text-red-400 bg-red-900/20 border-red-800" : "text-green-400 bg-green-900/20 border-green-800"}`}>
              {message.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Family Name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              placeholder="e.g. The Adefuwa Family"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? "Creating..." : "Create Family"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Org info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{org.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            org.subscription_status === "active" ? "bg-green-900/30 text-green-400 border-green-800" :
            org.subscription_status === "trialing" ? "bg-blue-900/30 text-blue-400 border-blue-800" :
            "bg-gray-800 text-gray-400 border-gray-700"
          }`}>
            {org.subscription_status}
          </span>
        </div>
        {org.subscription_status === "inactive" && (
          <a href="/billing" className="mt-3 inline-block text-sm text-talab-400 hover:underline">
            Activate subscription →
          </a>
        )}
      </div>

      {/* Students */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Students ({students.length})</h2>
        {students.length === 0 ? (
          <p className="text-gray-500 text-sm">No students yet. Invite one below.</p>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-full bg-talab-900/50 border border-talab-800 flex items-center justify-center text-sm font-medium text-talab-400 flex-shrink-0">
                  {student.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{student.full_name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {progressSummary[student.id] ?? 0} lessons completed
                  </p>
                </div>
                <a
                  href={`/family/student/${student.id}`}
                  className="text-xs text-talab-500 hover:text-talab-400 transition-colors"
                >
                  View progress →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite form */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Invite a Student</h2>
        <form onSubmit={sendInvite} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {message && (
            <div className={`text-sm px-3 py-2 rounded-lg border ${message.type === "error" ? "text-red-400 bg-red-900/20 border-red-800" : "text-green-400 bg-green-900/20 border-green-800"}`}>
              {message.text}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Student Name</label>
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                placeholder="e.g. Yusuf"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="student@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
