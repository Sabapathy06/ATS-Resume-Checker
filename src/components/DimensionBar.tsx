import { scoreColor } from '../lib/format';

export default function DimensionBar({
  label,
  score,
  weight,
  summary,
}: {
  label: string;
  score: number;
  weight: number;
  summary?: string;
}) {
  const color = scoreColor(score);

  return (
    <div className="glass rounded-2xl p-4 transition-colors hover:border-white/15">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-slate-600">{weight}% wt</span>
          <span className="font-display text-lg font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }}
        />
      </div>
      {summary && <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-500">{summary}</p>}
    </div>
  );
}
