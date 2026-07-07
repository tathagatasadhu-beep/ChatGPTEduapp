"use client";

import { useEffect, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import type { AttemptResult, QuestionOut } from "@/lib/api";

export default function QuizRunner({ studentId, topicId }: { studentId: string; topicId: string }) {
  const [question, setQuestion] = useState<QuestionOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);

  async function loadNext() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/quiz/next-question?topic_id=${topicId}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setQuestion(null);
      setError(data.error || "No more questions available in this topic right now.");
      return;
    }
    setQuestion(data);
    setQuestionNumber((n) => n + 1);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount/topic change is intentional
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  async function handleSubmit(answer: string): Promise<AttemptResult> {
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, question_id: question!.id, submitted_answer: answer }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Submit failed.");
    return data;
  }

  if (loading && !question) {
    return <p className="text-center text-purple-400">Loading question...</p>;
  }
  if (error) {
    return <p className="text-center text-rose-500">{error}</p>;
  }
  if (!question) return null;

  return (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-purple-400">Question {questionNumber}</p>
      <QuestionCard question={question} onSubmit={handleSubmit} onNext={loadNext} />
    </div>
  );
}
