export default function StreakBadge({ streakDays }: { streakDays: number }) {
  if (streakDays <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-500">
        Start a streak today!
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-600">
      🔥 {streakDays} day{streakDays === 1 ? "" : "s"}
    </span>
  );
}
