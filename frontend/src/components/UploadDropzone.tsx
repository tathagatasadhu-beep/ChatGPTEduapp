"use client";

import { useEffect, useRef, useState } from "react";
import type { Subject } from "@/lib/api";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "tracking"; pdfId: string; status: string; originalName: string }
  | { phase: "error"; message: string };

const POLL_INTERVAL_MS = 3000;

export default function UploadDropzone({ subjects }: { subjects: Subject[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.phase !== "tracking") return;
    if (state.status === "extracted" || state.status === "failed") return;

    const id = setInterval(async () => {
      const res = await fetch(`/api/pdfs/${state.pdfId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setState((prev) =>
        prev.phase === "tracking" ? { ...prev, status: data.status } : prev
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [state]);

  async function handleFile(file: File) {
    if (!subjectId) {
      setState({ phase: "error", message: "Choose a subject first." });
      return;
    }
    if (file.type !== "application/pdf") {
      setState({ phase: "error", message: "Only PDF files are accepted." });
      return;
    }

    setState({ phase: "uploading" });
    const form = new FormData();
    form.append("file", file);
    form.append("subject_id", subjectId);

    const res = await fetch("/api/pdfs/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setState({ phase: "error", message: data.error || "Upload failed." });
      return;
    }
    setState({ phase: "tracking", pdfId: data.id, status: data.status, originalName: data.original_name });
  }

  const statusCopy: Record<string, string> = {
    pending: "Queued...",
    processing: "Reading the worksheet and extracting questions...",
    extracted: "Done — questions added to the library.",
    failed: "Something went wrong processing this file.",
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-3 font-semibold text-zinc-700">Upload a worksheet (PDF)</h3>

      {subjects.length > 0 && (
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition
          ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-zinc-300 hover:border-indigo-300"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {state.phase === "uploading" ? (
          <span className="text-indigo-500">Uploading...</span>
        ) : (
          <span className="text-zinc-500">Drop a PDF here, or click to choose one.</span>
        )}
      </div>

      {state.phase === "tracking" && (
        <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
          <p className="font-medium text-zinc-700">{state.originalName}</p>
          <p className={state.status === "failed" ? "text-rose-500" : "text-zinc-500"}>
            {statusCopy[state.status] ?? state.status}
          </p>
        </div>
      )}

      {state.phase === "error" && (
        <p className="mt-3 text-sm text-rose-500">{state.message}</p>
      )}
    </div>
  );
}
