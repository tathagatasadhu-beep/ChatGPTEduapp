"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/student-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "That code didn't work.");
      return;
    }
    router.push(`/student/${data.student.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white px-6 py-24">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-purple-100">
        <h1 className="mb-2 text-2xl font-bold text-zinc-800">Ready to play?</h1>
        <p className="mb-6 text-sm text-zinc-500">Enter the code your parent gave you.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            autoFocus
            placeholder="Login code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-xl border-2 border-purple-200 px-4 py-3 text-center font-mono text-lg tracking-widest focus:border-purple-400 focus:outline-none"
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !code}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Checking..." : "Let's Go!"}
          </button>
        </form>
      </div>
    </div>
  );
}
