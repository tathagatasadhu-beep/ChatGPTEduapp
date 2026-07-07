import Link from "next/link";
import type { MasteryStat, Topic } from "@/lib/api";

function masteryStyle(stat: MasteryStat | undefined) {
  if (!stat || stat.total_first_attempts === 0) {
    return { label: "New", ring: "ring-zinc-300", dot: "bg-zinc-300", text: "text-zinc-500" };
  }
  if (stat.accuracy_rate >= 80) {
    return { label: `${stat.accuracy_rate}% mastered`, ring: "ring-emerald-400", dot: "bg-emerald-500", text: "text-emerald-600" };
  }
  if (stat.accuracy_rate >= 50) {
    return { label: `${stat.accuracy_rate}% practicing`, ring: "ring-amber-400", dot: "bg-amber-500", text: "text-amber-600" };
  }
  return { label: `${stat.accuracy_rate}% needs work`, ring: "ring-rose-400", dot: "bg-rose-500", text: "text-rose-600" };
}

export default function ProgressTrail({
  studentId,
  topics,
  masteryByTopic,
}: {
  studentId: string;
  topics: Topic[];
  masteryByTopic: Map<string, MasteryStat>;
}) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-purple-400 italic">
        No topics yet — ask a parent to upload a worksheet to start your quest!
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {topics.map((topic, i) => {
        const style = masteryStyle(masteryByTopic.get(topic.id));
        return (
          <li key={topic.id}>
            <Link
              href={`/student/${studentId}/quiz/${topic.id}`}
              className={`flex items-center gap-4 rounded-2xl border-2 bg-white px-4 py-3 shadow-sm ring-2 ${style.ring} transition hover:scale-[1.01] hover:shadow-md`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${style.dot}`}>
                {i + 1}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-zinc-800">{topic.name}</span>
                <span className={`block text-xs font-medium ${style.text}`}>{style.label}</span>
              </span>
              <span className="text-purple-400">→</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
