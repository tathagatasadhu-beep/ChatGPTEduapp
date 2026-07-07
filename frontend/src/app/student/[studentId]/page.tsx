import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { getStudentToken } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import ProgressTrail from "@/components/ProgressTrail";
import StreakBadge from "@/components/StreakBadge";
import XPBar from "@/components/XPBar";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const token = await getStudentToken();
  if (!token) redirect("/student/login");

  let me: Awaited<ReturnType<typeof api.getMyProfile>>;
  try {
    me = await api.getMyProfile(token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/student/login");
    throw err;
  }

  if (me.id !== studentId) {
    redirect(`/student/${me.id}`);
  }

  const [mastery, subjects] = await Promise.all([api.getMyMastery(token), api.listSubjects()]);

  const attempted = mastery.filter((m) => m.total_first_attempts > 0);
  const weakest = attempted.length
    ? attempted.reduce((min, m) => (m.accuracy_rate < min.accuracy_rate ? m : min))
    : null;
  const greeting = weakest ? `Let's work on ${weakest.topic_name} today!` : "Ready to start your first quest?";

  const masteryByTopic = new Map(mastery.map((m) => [m.topic_id, m]));

  const subjectsWithTopics = await Promise.all(
    subjects.map(async (s) => ({ subject: s, topics: await api.listTopics(s.id) }))
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Hi, {me.display_name}! 👋</h1>
          <p className="text-purple-500">{greeting}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-8 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
        <div className="flex-1">
          <XPBar xpTotal={me.xp_total} />
        </div>
        <StreakBadge streakDays={me.streak_days} />
      </div>

      {subjectsWithTopics.length === 0 && (
        <p className="text-zinc-400">No quests yet — ask a parent to upload a worksheet!</p>
      )}

      {subjectsWithTopics.map(({ subject, topics }) => (
        <section key={subject.id} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-400">
            {subject.name}
          </h2>
          <ProgressTrail studentId={me.id} topics={topics} masteryByTopic={masteryByTopic} />
        </section>
      ))}
    </div>
  );
}
