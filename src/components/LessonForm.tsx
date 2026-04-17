"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  courseId: string;
}

export default function LessonForm({ courseId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const durationMins = formData.get("duration_seconds") as string;
    const payload = {
      course_id: courseId,
      title: formData.get("title") as string,
      r2_key: (formData.get("r2_key") as string) || null,
      content_body: (formData.get("content_body") as string) || null,
      position: parseInt(formData.get("position") as string, 10),
      duration_seconds: durationMins ? parseInt(durationMins, 10) * 60 : null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase as any)
      .from("lessons")
      .insert(payload)
      .select()
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(`/lessons/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Lesson Title *</label>
        <input
          name="title"
          required
          placeholder="e.g. Introduction to Fractions"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Position *</label>
          <input
            name="position"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Duration (minutes)</label>
          <input
            name="duration_seconds"
            type="number"
            min={1}
            placeholder="20"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          R2 Video Key
          <span className="text-gray-500 font-normal ml-1">(filename in your R2 bucket)</span>
        </label>
        <input
          name="r2_key"
          placeholder="videos/year5-math/fractions-intro.mp4"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Lesson Content (HTML)</label>
        <textarea
          name="content_body"
          rows={6}
          placeholder="<p>Lesson notes, explanations, resources...</p>"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 resize-y font-mono text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
      >
        {loading ? "Creating..." : "Create Lesson"}
      </button>
    </form>
  );
}
