const XP_PER_LEVEL = 500;

export default function XPBar({ xpTotal }: { xpTotal: number }) {
  const level = Math.floor(xpTotal / XP_PER_LEVEL) + 1;
  const progress = xpTotal % XP_PER_LEVEL;
  const percent = Math.round((progress / XP_PER_LEVEL) * 100);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-semibold text-purple-700">Level {level}</span>
        <span className="text-xs text-purple-400">{progress} / {XP_PER_LEVEL} XP</span>
      </div>
      <div className="h-3 w-full rounded-full bg-purple-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
