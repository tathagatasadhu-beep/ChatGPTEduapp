import { redirect } from "next/navigation";
import { ApiError, api, type MasteryStat } from "@/lib/api";
import { getParentToken } from "@/lib/session";
import AddStudentForm from "./AddStudentForm";
import LogoutButton from "@/components/LogoutButton";
import StreakBadge from "@/components/StreakBadge";
import UploadDropzone from "@/components/UploadDropzone";
import XPBar from "@/components/XPBar";

export default async function ParentDashboardPage() {
  const token = await getParentToken();
  if (!token) redirect("/parent/login");

  let students: Awaited<ReturnType<typeof api.listStudents>>;
  let subjects: Awaited<ReturnType<typeof api.listSubjects>>;
  try {
    [students, subjects] = await Promise.all([api.listStudents(token), api.listSubjects()]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/parent/login");
    throw err;
  }

  const masteryEntries = await Promise.all(
    students.map(async (s) => {
      try {
        return [s.id, await api.getMastery(token, s.id)] as const;
      } catch {
        return [s.id, [] as MasteryStat[]] as const;
      }
    })
  );
  const masteryByStudent = new Map(masteryEntries);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-800">Parent Dashboard</h1>
        <LogoutButton />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Students</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {students.map((s) => {
            const mastery = masteryByStudent.get(s.id) ?? [];
            const overallAccuracy = mastery.length
              ? Math.round(mastery.reduce((sum, m) => sum + m.accuracy_rate, 0) / mastery.length)
              : null;
            return (
              <div key={s.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-zinc-800">{s.display_name}</span>
                  <StreakBadge streakDays={s.streak_days} />
                </div>
                {s.grade_level && <p className="mb-3 text-xs text-zinc-400">Grade {s.grade_level}</p>}
                <XPBar xpTotal={s.xp_total} />
                <p className="mt-3 text-sm text-zinc-500">
                  {overallAccuracy === null ? "No practice yet" : `${overallAccuracy}% overall accuracy`}
                </p>
              </div>
            );
          })}
          <AddStudentForm />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Worksheet Library</h2>
        <UploadDropzone subjects={subjects} />
        {subjects.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <li key={s.id} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
