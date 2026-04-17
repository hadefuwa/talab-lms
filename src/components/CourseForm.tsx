"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/lib/types";

const SUBJECTS = ["Math", "Science", "English", "History", "Arabic", "Quran", "Art", "PE", "Other"];

interface Props {
  course?: Course;
}

export default function CourseForm({ course }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!course;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || null,
      subject_category: fd.get("subject_category") as string,
      is_published: fd.get("is_published") === "on",
      is_free: fd.get("is_free") === "on",
    };

    if (isEdit) {
      const { error: err } = await (supabase as any)
        .from("courses").update(payload).eq("id", course.id);
      if (err) { setError(err.message); setLoading(false); return; }
      router.push(`/courses/${course.id}`);
      router.refresh();
    } else {
      const { data, error: err } = await (supabase as any)
        .from("courses").insert(payload).select().single();
      if (err) { setError(err.message); setLoading(false); return; }
      router.push(`/courses/${data.id}`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/courses/${course!.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Delete failed");
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
        <input
          name="title" required defaultValue={course?.title}
          placeholder="e.g. Year 5 Mathematics"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
        <select
          name="subject_category" required defaultValue={course?.subject_category ?? "Math"}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
        >
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea
          name="description" rows={3} defaultValue={course?.description ?? ""}
          placeholder="Brief overview of the course..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox" name="is_published" id="is_published"
            defaultChecked={course?.is_published ?? false}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-talab-600"
          />
          <label htmlFor="is_published" className="text-sm text-gray-300">Published</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox" name="is_free" id="is_free"
            defaultChecked={course?.is_free ?? false}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-talab-600"
          />
          <label htmlFor="is_free" className="text-sm text-gray-300">
            Free course <span className="text-gray-500 font-normal">(no subscription needed)</span>
          </label>
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
      >
        {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Course"}
      </button>

      {isEdit && (
        <div className="pt-2 border-t border-gray-800">
          {!confirmDelete ? (
            <button
              type="button" onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-colors"
            >
              Delete Course
            </button>
          ) : (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-300 font-medium">
                Delete &quot;{course.title}&quot;? This will also remove all its lessons and student progress.
              </p>
              <div className="flex gap-2">
                <button
                  type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
