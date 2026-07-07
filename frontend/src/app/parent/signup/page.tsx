"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ParentSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/parent-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Signup failed.");
      return;
    }
    if (data.pendingConfirmation) {
      setPendingMessage(data.message);
      return;
    }
    router.push("/parent");
    router.refresh();
  }

  if (pendingMessage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
          <h1 className="mb-3 text-xl font-semibold text-zinc-800">Almost there</h1>
          <p className="text-sm text-zinc-500">{pendingMessage}</p>
          <Link href="/parent/login" className="mt-6 inline-block text-sm font-medium text-indigo-600">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <h1 className="mb-6 text-xl font-semibold text-zinc-800">Create a Parent Account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/parent/login" className="font-medium text-indigo-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
