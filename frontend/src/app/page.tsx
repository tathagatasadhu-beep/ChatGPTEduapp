import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-6 py-24">
      <h1 className="mb-2 text-4xl font-bold text-zinc-800">EduQuestAI</h1>
      <p className="mb-10 max-w-md text-center text-zinc-500">
        Turn your family&apos;s worksheets into an adaptive practice quest.
      </p>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link
          href="/parent/login"
          className="rounded-xl bg-indigo-600 px-6 py-4 text-center font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          I&apos;m a Parent
        </Link>
        <Link
          href="/student/login"
          className="rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 px-6 py-4 text-center font-bold text-white shadow-sm transition hover:opacity-90"
        >
          I&apos;m a Student
        </Link>
      </div>
    </div>
  );
}
