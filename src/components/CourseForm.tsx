"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SUBJECTS = ["Math", "Science", "English", "History", "Arabic", "Quran", "Art", "PE", "Other"];

export default function CourseForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      subject_category: formData.get("subject_category") as string,
      is_published: formData.get("is_published") === "on",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase as any)
      .from("courses")
      .insert(payload)
      .select()
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(`/courses/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
        <input
          name="title"
          required
          placeholder="e.g. Year 5 Mathematics"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
        <select
          name="subject_category"
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Brief overview of the course..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_published"
          id="is_published"
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-talab-600"
        />
        <label htmlFor="is_published" className="text-sm text-gray-300">Publish immediately</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
      >
        {loading ? "Creating..." : "Create Course"}
      </button>
    </form>
  );
}
