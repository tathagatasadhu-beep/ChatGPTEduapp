"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddStudentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<{ name: string; code: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName, grade_level: gradeLevel || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Could not add student.");
      return;
    }
    setCreatedCode({ name: data.display_name, code: data.login_code });
    setDisplayName("");
    setGradeLevel("");
    setOpen(false);
  }

  function handleDone() {
    setCreatedCode(null);
    router.refresh();
  }

  if (createdCode) {
    return (
      <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-5">
        <p className="font-semibold text-indigo-800">
          {createdCode.name}&apos;s login code:{" "}
          <span className="font-mono text-lg">{createdCode.code}</span>
        </p>
        <p className="mt-1 text-sm text-indigo-600">
          Write this down — it&apos;s only shown once. Give it to your child to log in at /student/login.
        </p>
        <button
          onClick={handleDone}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Got it
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-5 text-sm font-medium text-zinc-500 transition hover:border-indigo-300 hover:text-indigo-600"
      >
        + Add a student
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4">
      <input
        required
        placeholder="Student name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
      />
      <input
        placeholder="Grade level (optional)"
        value={gradeLevel}
        onChange={(e) => setGradeLevel(e.target.value)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
