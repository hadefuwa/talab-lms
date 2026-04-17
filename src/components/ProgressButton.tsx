"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  lessonId: string;
  orgId: string;
  currentStatus: string;
}

export default function ProgressButton({ lessonId, orgId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function markComplete() {
    if (status === "completed" || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, orgId, status: "completed" }),
      });

      if (res.ok) {
        setStatus("completed");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 text-green-400 font-medium">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Lesson completed
      </div>
    );
  }

  return (
    <button
      onClick={markComplete}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      Mark as Complete
    </button>
  );
}
