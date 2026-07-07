"use client";

import { useState } from "react";
import type { AttemptResult, QuestionOut } from "@/lib/api";

export default function QuestionCard({
  question,
  onSubmit,
  onNext,
}: {
  question: QuestionOut;
  onSubmit: (answer: string) => Promise<AttemptResult>;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMultipleChoice = question.question_type === "multiple_choice";
  const answered = result !== null;

  async function handleSubmit() {
    if (!answer || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await onSubmit(answer);
      setResult(res);
    } catch {
      setError("Couldn't submit that answer — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    setAnswer("");
    setResult(null);
    setError(null);
    onNext();
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-purple-100">
      <p className="mb-5 text-lg font-semibold text-zinc-800">{question.prompt_text}</p>

      {isMultipleChoice ? (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const label = opt.option_label ?? opt.option_text;
            const selected = answer === label;
            return (
              <button
                key={label}
                disabled={answered}
                onClick={() => setAnswer(label)}
                className={`rounded-xl border-2 px-4 py-3 text-left font-medium transition
                  ${selected ? "border-purple-500 bg-purple-50" : "border-zinc-200 hover:border-purple-300"}
                  ${answered ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                <span className="mr-2 text-purple-500">{opt.option_label}</span>
                {opt.option_text}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          disabled={answered}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full rounded-xl border-2 border-zinc-200 px-4 py-3 font-medium focus:border-purple-400 focus:outline-none disabled:opacity-70"
        />
      )}

      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

      {!answered ? (
        <button
          onClick={handleSubmit}
          disabled={!answer || submitting}
          className="mt-5 w-full rounded-xl bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Submit Answer"}
        </button>
      ) : (
        <div className="mt-5">
          <div
            className={`rounded-xl px-4 py-3 font-semibold ${
              result.is_correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {result.is_correct ? "🎉 Correct!" : `Not quite — the answer was ${result.correct_answer}.`}
            {result.added_to_review_queue && (
              <span className="mt-1 block text-xs font-normal text-rose-500">
                Added to your review queue — you&apos;ll see this again soon.
              </span>
            )}
          </div>
          <button
            onClick={handleNext}
            className="mt-3 w-full rounded-xl bg-zinc-800 py-3 font-bold text-white transition hover:bg-zinc-900"
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}
