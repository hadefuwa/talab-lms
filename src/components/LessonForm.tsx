"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  courseId: string;
}

const BUILT_IN_GAMES = [
  { label: "Flappy Bird", path: "/games/flappy-bird/index.html" },
];

export default function LessonForm({ courseId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonType, setLessonType] = useState<"content" | "video" | "game">("content");

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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase as any)
      .from("lessons")
      .insert(payload)
      .select()
      .single();

    if (err) { setError(err.message); setLoading(false); return; }
    router.push(`/lessons/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Lesson Title *</label>
        <input
          name="title" required
          placeholder="e.g. Fractions Practice Game"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
        />
      </div>

      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Lesson Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(["content", "video", "game"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setLessonType(t)}
              className={`py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                lessonType === t
                  ? "bg-talab-600 border-talab-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {t === "content" ? "📄 Reading" : t === "video" ? "🎬 Video" : "🎮 Game"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Position *</label>
          <input
            name="position" type="number" min={1} defaultValue={1} required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
          />
        </div>
        {lessonType !== "game" && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Duration (minutes)</label>
            <input
              name="duration_seconds" type="number" min={1} placeholder="20"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
            />
          </div>
        )}
      </div>

      {lessonType === "video" && (
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
      )}

      {(lessonType === "content" || lessonType === "video") && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Lesson Content (HTML)</label>
          <textarea
            name="content_body" rows={6}
            placeholder="<p>Lesson notes, explanations, resources...</p>"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 resize-y font-mono text-sm"
          />
        </div>
      )}

      {lessonType === "game" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Game</label>
            <select
              name="game_path"
              defaultValue={BUILT_IN_GAMES[0].path}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
            >
              {BUILT_IN_GAMES.map((g) => (
                <option key={g.path} value={g.path}>{g.label}</option>
              ))}
              <option value="custom">Custom path…</option>
            </select>
            <p className="text-xs text-gray-600 mt-1.5">
              Add your own games to <code className="text-gray-500">public/games/</code> and they&apos;ll appear here.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Pass score
              <span className="text-gray-500 font-normal ml-1">(minimum score to mark complete)</span>
            </label>
            <input
              name="game_pass_score" type="number" min={1} defaultValue={5}
              className="w-28 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
            />
          </div>
        </>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
      >
        {loading ? "Creating..." : "Create Lesson"}
      </button>
    </form>
  );
}
