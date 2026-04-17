"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface QuestionDraft {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

const BLANK_QUESTION = (): QuestionDraft => ({
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
});

interface Props {
  courseId: string;
}

export default function QuizBuilder({ courseId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passScore, setPassScore] = useState(70);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([BLANK_QUESTION()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(idx: number, field: keyof QuestionDraft, value: unknown) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? value : o) } : q
      )
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, BLANK_QUESTION()]);
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: quiz, error: quizErr } = await (supabase as any)
      .from("quizzes")
      .insert({ course_id: courseId, title, description: description || null, pass_score: passScore, is_published: isPublished })
      .select()
      .single();

    if (quizErr) { setError(quizErr.message); setLoading(false); return; }

    const questionRows = questions
      .filter((q) => q.question.trim() && q.options.every((o) => o.trim()))
      .map((q, idx) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation || null,
        position: idx + 1,
      }));

    if (questionRows.length > 0) {
      const { error: qErr } = await (supabase as any)
        .from("quiz_questions")
        .insert(questionRows);
      if (qErr) { setError(qErr.message); setLoading(false); return; }
    }

    router.push(`/courses/${courseId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Quiz details */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Quiz Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} required
            placeholder="e.g. Fractions End-of-Unit Quiz"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Optional intro shown before the quiz starts..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 resize-none"
          />
        </div>
        <div className="flex items-center gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Pass mark (%)</label>
            <input
              type="number" min={1} max={100} value={passScore}
              onChange={(e) => setPassScore(parseInt(e.target.value))}
              className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-talab-500"
            />
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input
              type="checkbox" id="pub" checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-talab-600"
            />
            <label htmlFor="pub" className="text-sm text-gray-300">Publish immediately</label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Questions ({questions.length})</h2>
          <button
            type="button" onClick={addQuestion}
            className="text-sm text-talab-400 hover:text-talab-300 border border-talab-800 hover:border-talab-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add Question
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Question {qIdx + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button" onClick={() => removeQuestion(qIdx)}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              value={q.question}
              onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
              placeholder="Enter your question..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500"
            />

            <div className="space-y-2">
              <label className="text-xs text-gray-500">Options — click the circle to mark correct answer</label>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qIdx, "correct_index", oIdx)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                      q.correct_index === oIdx
                        ? "bg-green-500 border-green-500"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                  />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 text-sm"
                  />
                </div>
              ))}
            </div>

            <input
              value={q.explanation}
              onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
              placeholder="Explanation shown after answering (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-talab-500 text-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full py-3 bg-talab-600 hover:bg-talab-700 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
      >
        {loading ? "Saving..." : "Save Quiz"}
      </button>
    </form>
  );
}
