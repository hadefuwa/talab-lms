"use client";

import { useState } from "react";
import type { Organization, Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  org: Organization | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-900/30 text-green-400 border-green-800",
  trialing: "bg-blue-900/30 text-blue-400 border-blue-800",
  inactive: "bg-gray-800 text-gray-400 border-gray-700",
};

export default function BillingPanel({ profile, org }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(plan: "monthly" | "annual") {
    if (!org?.id) return;
    setLoading(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, orgId: org.id }),
    });
    const { url, error } = await res.json();
    if (error) { alert(error); setLoading(null); return; }
    window.location.href = url;
  }

  async function openPortal() {
    setLoading("portal");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (error) { alert(error); setLoading(null); return; }
    window.location.href = url;
  }

  const status = org?.subscription_status ?? "inactive";
  const isActive = status === "active" || status === "trialing";

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Subscription</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.inactive}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        {org ? (
          <p className="text-gray-400 text-sm">Family: <span className="text-white">{org.name}</span></p>
        ) : (
          <p className="text-gray-500 text-sm">No family organisation set up yet.</p>
        )}
        {isActive && (
          <button
            onClick={openPortal}
            disabled={loading === "portal"}
            className="mt-4 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading === "portal" ? "Loading..." : "Manage Subscription"}
          </button>
        )}
      </div>

      {/* Plans */}
      {!isActive && org && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-white font-semibold">Monthly</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">£19</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Full curriculum access</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Up to 5 students</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI lesson assistant</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Progress tracking</li>
            </ul>
            <button
              onClick={() => startCheckout("monthly")}
              disabled={!!loading}
              className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
            >
              {loading === "monthly" ? "Redirecting..." : "Subscribe Monthly"}
            </button>
          </div>

          {/* Annual */}
          <div className="bg-gray-900 border border-talab-700 rounded-2xl p-6 space-y-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-talab-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Save 17%
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Annual</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">£199</span>
                <span className="text-gray-500 text-sm">/year</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Full curriculum access</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Up to 5 students</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI lesson assistant</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Progress tracking</li>
            </ul>
            <button
              onClick={() => startCheckout("annual")}
              disabled={!!loading}
              className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
            >
              {loading === "annual" ? "Redirecting..." : "Subscribe Annually"}
            </button>
          </div>
        </div>
      )}

      {!org && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
          Set up your family organisation first on the{" "}
          <a href="/family" className="text-talab-400 hover:underline">Family page</a>.
        </div>
      )}
    </div>
  );
}
