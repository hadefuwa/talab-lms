"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lesson } from "@/lib/types";

interface Props {
  courseId: string;
  lesson?: Lesson;
}

const BUILT_IN_GAMES = [
  { label: "Flappy Bird (Original)", path: "/games/flappy-bird/index.html" },
  { label: "Flappy Bird Nursery — Level 1 (Easy, pass 3)", path: "/games/flappy-bird-nursery/index.html?level=1" },
  { label: "Flappy Bird Nursery — Level 2 (Medium, pass 5)", path: "/games/flappy-bird-nursery/index.html?level=2" },
  { label: "Flappy Bird Nursery — Level 3 (Hard, pass 8)", path: "/games/flappy-bird-nursery/index.html?level=3" },
];

export default function LessonForm({ courseId, lesson }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!lesson;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lessonType, setLessonType] = useState<"content" | "video" | "game" | "interactive">(
    lesson?.lesson_type ?? "content"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const durationMins = fd.get("duration_seconds") as string;
    const payload: Record<string, unknown> = {
      course_id: courseId,
      title: fd.get("title") as string,
      position: parseInt(fd.get("position") as string, 10),
      lesson_type: lessonType,
      r2_key: null,
      content_body: null,
      content_path: null,
      game_path: null,
      game_pass_score: null,
      duration_seconds: durationMins ? parseInt(durationMins, 10) * 60 : null,
    };

    if (lessonType === "video") {
      payload.r2_key = (fd.get("r2_key") as string) || null;
      payload.content_body = (fd.get("content_body") as string) || null;
    } else if (lessonType === "content") {
      payload.content_body = (fd.get("content_body") as string) || null;
    } else if (lessonType === "game") {
      payload.game_path = (fd.get("game_path") as string) || null;
      payload.game_pass_score = parseInt(fd.get("game_pass_score") as string, 10) || 5;
    } else if (lessonType === "interactive") {
      payload.content_path = (fd.get("content_path") as string) || null;
    }

    if (isEdit) {
      const { error: err } = await (supabase as any)
        .from("lessons").update(payload).eq("id", lesson.id);
      if (err) { setError(err.message); setLoading(false); return; }
      router.push(`/lessons/${lesson.id}`);
      router.refresh();
    } else {
      const { data, error: err } = await (supabase as any)
        .from("lessons").insert(payload).select().single();
      if (err) { setError(err.message); setLoading(false); return; }
      router.push(`/lessons/${data.id}`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/lessons/${lesson!.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Delete failed");
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }
    router.push(`/courses/${courseId}`);
    router.refresh();
  }

  const durationDefault = lesson?.duration_seconds ? Math.round(lesson.duration_seconds / 60) : undefined;
  const gamePathDefault = lesson?.game_path && !BUILT_IN_GAMES.find(g => g.path === lesson.game_path)
    ? lesson.game_path
    : lesson?.game_path ?? BUILT_IN_GAMES[0].path;

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Lesson Title *</label>
        <input
          name="title" required defaultValue={lesson?.title}
          placeholder="e.g. Fractions Practice Game"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Lesson Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(["content", "video", "game", "interactive"] as const).map((t) => (
            <button
              key={t} type="button" onClick={() => setLessonType(t)}
              className={`py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                lessonType === t
                  ? "bg-talab-600 border-talab-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {t === "content" ? "📄 Reading" : t === "video" ? "🎬 Video" : t === "game" ? "🎮 Game" : "🧩 Interactive"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Position *</label>
          <input
            name="position" type="number" min={1}
            defaultValue={lesson?.position ?? 1} required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
          />
        </div>
        {lessonType !== "game" && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Duration (minutes)</label>
            <input
              name="duration_seconds" type="number" min={1}
              defaultValue={durationDefault} placeholder="20"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
            />
          </div>
        )}
      </div>

      {lessonType === "video" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            R2 Video Key <span className="text-gray-500 font-normal ml-1">(filename in your R2 bucket)</span>
          </label>
          <input
            name="r2_key" defaultValue={lesson?.r2_key ?? ""}
            placeholder="videos/year5-math/fractions-intro.mp4"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 font-mono text-sm"
          />
        </div>
      )}

      {(lessonType === "content" || lessonType === "video") && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Lesson Content (HTML)</label>
          <textarea
            name="content_body" rows={6}
            defaultValue={lesson?.content_body ?? ""}
            placeholder="<p>Lesson notes, explanations, resources...</p>"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 resize-y font-mono text-sm"
          />
        </div>
      )}

      {lessonType === "interactive" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Lesson file <span className="text-gray-500 font-normal ml-1">(filename in /public/lessons/)</span>
          </label>
          <input
            name="content_path"
            defaultValue={lesson?.content_path ?? ""}
            placeholder="nursery-counting-to-5.json"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 font-mono text-sm"
          />
        </div>
      )}

      {lessonType === "game" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Game</label>
            <select
              name="game_path" defaultValue={gamePathDefault}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
            >
              {BUILT_IN_GAMES.map((g) => (
                <option key={g.path} value={g.path}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Pass score <span className="text-gray-500 font-normal ml-1">(minimum score to mark complete)</span>
            </label>
            <input
              name="game_pass_score" type="number" min={1}
              defaultValue={lesson?.game_pass_score ?? 5}
              className="w-28 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
            />
          </div>
        </>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
      >
        {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Lesson"}
      </button>

      {isEdit && (
        <div className="pt-2 border-t border-gray-800">
          {!confirmDelete ? (
            <button
              type="button" onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-colors"
            >
              Delete Lesson
            </button>
          ) : (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-300 font-medium">
                Delete &quot;{lesson.title}&quot;? Student progress for this lesson will also be removed.
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
