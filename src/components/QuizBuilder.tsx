"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Quiz, QuizQuestion } from "@/lib/types";

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
  quiz?: Quiz;
  existingQuestions?: QuizQuestion[];
}

export default function QuizBuilder({ courseId, quiz, existingQuestions }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!quiz;

  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [passScore, setPassScore] = useState(quiz?.pass_score ?? 70);
  const [isPublished, setIsPublished] = useState(quiz?.is_published ?? false);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    existingQuestions?.length
      ? existingQuestions.map((q) => ({
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation ?? "",
        }))
      : [BLANK_QUESTION()]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  function addQuestion() { setQuestions((prev) => [...prev, BLANK_QUESTION()]); }
  function removeQuestion(idx: number) { setQuestions((prev) => prev.filter((_, i) => i !== idx)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const quizPayload = {
      course_id: courseId,
      title,
      description: description || null,
      pass_score: passScore,
      is_published: isPublished,
    };

    let quizId: string;

    if (isEdit) {
      const { error: quizErr } = await (supabase as any)
        .from("quizzes").update(quizPayload).eq("id", quiz.id);
      if (quizErr) { setError(quizErr.message); setLoading(false); return; }
      // Replace all questions: delete then re-insert
      await (supabase as any).from("quiz_questions").delete().eq("quiz_id", quiz.id);
      quizId = quiz.id;
    } else {
      const { data: newQuiz, error: quizErr } = await (supabase as any)
        .from("quizzes").insert(quizPayload).select().single();
      if (quizErr) { setError(quizErr.message); setLoading(false); return; }
      quizId = newQuiz.id;
    }

    const questionRows = questions
      .filter((q) => q.question.trim() && q.options.every((o) => o.trim()))
      .map((q, idx) => ({
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation || null,
        position: idx + 1,
      }));

    if (questionRows.length > 0) {
      const { error: qErr } = await (supabase as any).from("quiz_questions").insert(questionRows);
      if (qErr) { setError(qErr.message); setLoading(false); return; }
    }

    router.push(`/courses/${courseId}`);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/quizzes/${quiz!.id}`, { method: "DELETE" });
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
            <label htmlFor="pub" className="text-sm text-gray-300">Published</label>
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
                >Remove</button>
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
                      q.correct_index === oIdx ? "bg-green-500 border-green-500" : "border-gray-600 hover:border-gray-400"
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
        {loading ? "Saving..." : isEdit ? "Save Quiz" : "Create Quiz"}
      </button>

      {isEdit && (
        <div className="border-t border-gray-800 pt-4">
          {!confirmDelete ? (
            <button
              type="button" onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-colors"
            >
              Delete Quiz
            </button>
          ) : (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-300 font-medium">
                Delete &quot;{quiz.title}&quot;? All student attempts will also be removed.
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
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
