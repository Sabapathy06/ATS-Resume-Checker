import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export const ANALYSIS_STAGES = [
  { label: 'Extracting resume content', detail: 'Reading and normalising the document text', icon: 'file' },
  { label: 'Analyzing resume structure', detail: 'Mapping sections, headings and contact blocks', icon: 'layout' },
  { label: 'Identifying keywords', detail: 'Mining skills, tools and role vocabulary', icon: 'search' },
  { label: 'Comparing job requirements', detail: 'Matching the posting against your experience', icon: 'target' },
  { label: 'Generating recommendations', detail: 'Building prioritised, section-specific fixes', icon: 'sparkles' },
];

export default function LoadingStages({ current, error }: { current: number; error?: string | null }) {
  const pct = Math.min(100, Math.round(((current + 1) / ANALYSIS_STAGES.length) * 92));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-iris-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-electric-500/20 blur-3xl" />

      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500 to-iris-600">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
            <span className="absolute inset-0 animate-[pulse-ring_2.6s_ease-out_infinite] rounded-xl bg-iris-500/40" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Analyzing your resume</h3>
            <p className="text-xs text-slate-400">Deterministic rule engine — no random scores</p>
          </div>
        </div>

        <div className="mb-7 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-glow"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <ol className="space-y-1">
          {ANALYSIS_STAGES.map((stage, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={stage.label} className="flex items-center gap-4 rounded-xl px-3 py-2.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors $
                    ${done ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300' : active ? 'border-iris-400/60 bg-iris-500/20 text-iris-200' : 'border-white/10 bg-white/[0.03] text-slate-600'}`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium transition-colors $
                      ${done ? 'text-slate-400' : active ? 'text-white' : 'text-slate-600'}`}
                  >
                    {stage.label}
                    {active && <span className="ml-2 inline-block animate-pulse text-iris-300">•••</span>}
                  </p>
                  {active && <p className="mt-0.5 text-xs text-slate-500">{stage.detail}</p>}
                </div>
                {done && <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/70">done</span>}
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
        )}
      </div>
    </motion.div>
  );
}
