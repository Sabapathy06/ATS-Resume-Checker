import { Check, X } from 'lucide-react';
import type { AnalysisCheck } from '../types';

export default function CheckRow({ check }: { check: AnalysisCheck }) {
  const ratio = typeof check.partial === 'number' && !check.passed ? check.partial : check.passed ? 1 : 0;
  const earned = Math.round(check.points * Math.min(1, Math.max(0, ratio)));
  const partial = !check.passed && earned > 0;

  return (
    <div className="flex gap-3 border-b border-white/5 py-3 last:border-0">
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border $
          ${check.passed ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : partial ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-rose-400/40 bg-rose-400/10 text-rose-300'}`}
      >
        {check.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className={`text-sm font-medium ${check.passed ? 'text-slate-200' : 'text-slate-300'}`}>{check.label}</p>
          <span className="font-mono text-[11px] text-slate-500">
            {earned}/{check.points} pts
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{check.detail}</p>
      </div>
    </div>
  );
}
