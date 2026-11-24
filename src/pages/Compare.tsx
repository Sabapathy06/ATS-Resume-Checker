import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, GitCompare, ScanSearch, ArrowRight, Trophy, Check, X } from 'lucide-react';
import { api } from '../lib/api';
import type { AnalysisSummary } from '../types';
import { formatDate, ratingBadgeClass, scoreColor } from '../lib/format';

const DIMENSION_LABELS = [
  ['formatting', 'ATS Formatting'], ['keywords', 'Keyword Optimization'], ['skills', 'Skills Match'],
  ['experience', 'Work Experience'], ['education', 'Education'], ['structure', 'Section Structure'], ['readability', 'Readability'],
] as const;

export default function Compare() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AnalysisSummary[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [full, setFull] = useState<Record<string, import('../types').AnalysisRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listAnalyses()
      .then((list) => {
        setItems(list);
        setSelected(list.slice(0, Math.min(2, list.length)).map((i) => i.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your reports.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const missing = selected.filter((id) => !full[id]);
    if (!missing.length) return;
    Promise.all(missing.map((id) => api.getAnalysis(id)))
      .then((recs) => setFull((prev) => { const next = { ...prev }; recs.forEach((r) => { next[r.id] = r; }); return next; }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load a report.'));
  }, [selected, full]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]));
  };

  const records = useMemo(() => selected.map((id) => full[id]).filter(Boolean), [selected, full]);
  const best = records.length ? records.reduce((a, b) => (b.overall_score > a.overall_score ? b : a)) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 pt-24">
        <div className="flex flex-col items-center gap-3"><Loader2 className="h-7 w-7 animate-spin text-iris-400" /><p className="text-sm text-slate-500">Loading reports…</p></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-ink-950 pb-20 pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 grid-bg" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-sm text-slate-500 transition-colors hover:text-white">← Dashboard</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip border-iris-400/25 bg-iris-500/10 text-iris-200"><GitCompare className="h-3 w-3" /> Compare</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Compare resume versions</h1>
            <p className="mt-2 text-sm text-slate-400">Select up to three reports to see which version performs best, dimension by dimension.</p>
          </div>
          <Link to="/analyzer" className="btn-ghost !py-2.5 !text-sm"><ScanSearch className="h-4 w-4" /> New analysis</Link>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3.5 text-[13px] text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {items.length < 2 ? (
          <div className="glass-strong mt-8 rounded-3xl p-10 text-center">
            <GitCompare className="mx-auto h-9 w-9 text-slate-600" />
            <h2 className="mt-4 font-display text-lg font-semibold text-white">You need at least two analyses to compare</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Analyze your resume, make the recommended changes, then analyze the new version to see the movement.</p>
            <Link to="/analyzer" className="btn-primary mt-6">Analyze a resume</Link>
          </div>
        ) : (
          <>
            <div className="glass-strong mt-8 rounded-3xl p-6">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-400">Select reports ({selected.length}/3)</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {items.map((it) => {
                  const on = selected.includes(it.id);
                  return (
                    <button key={it.id} onClick={() => toggle(it.id)} disabled={!on && selected.length >= 3}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors disabled:opacity-40 ${on ? 'border-iris-400/40 bg-iris-500/10' : 'border-white/5 bg-white/[0.02] hover:border-white/15'}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-iris-400 bg-iris-500/30 text-white' : 'border-white/15 text-transparent'}`}>
                        {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 text-transparent" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{it.title}</p>
                        <p className="text-[11px] text-slate-500">{it.role_label} · {formatDate(it.created_at)}</p>
                      </div>
                      <span className="font-display text-lg font-bold" style={{ color: scoreColor(it.overall_score) }}>{it.overall_score}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {records.length >= 2 && (
              <div className="mt-6 overflow-x-auto">
                <div className="min-w-[720px]">
                  <div className="grid gap-4" style={{ gridTemplateColumns: `1.1fr repeat(${records.length}, 1fr)` }}>
                    <div />
                    {records.map((r) => (
                      <div key={r.id} className="glass rounded-2xl p-4 text-center">
                        {best && r.id === best.id && <span className="chip mx-auto mb-2 border-amber-400/30 bg-amber-500/10 text-amber-300"><Trophy className="h-3 w-3" /> Best</span>}
                        <p className="truncate text-sm font-semibold text-white">{r.title}</p>
                        <p className="mt-1 font-display text-4xl font-bold" style={{ color: scoreColor(r.overall_score) }}>{r.overall_score}</p>
                        <span className={`chip mt-2 ${ratingBadgeClass(r.rating)}`}>{r.rating}</span>
                        <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                          <p>{r.result.meta.roleLabel}</p>
                          <p>{r.result.stats.wordCount} words · {r.result.stats.bulletCount} bullets</p>
                          <p>{r.result.keywords.matched.length} keywords matched</p>
                          {r.result.jobMatch.hasJD ? <p className="text-emerald-300">JD match {r.result.jobMatch.compatibility}%</p> : <p>No JD compared</p>}
                        </div>
                        <button onClick={() => navigate(`/report/${r.id}`)} className="btn-ghost mt-4 w-full !py-2 !text-xs">Open report <ArrowRight className="h-3 w-3" /></button>
                      </div>
                    ))}

                    {DIMENSION_LABELS.map(([key, label]) => (
                      <>
                        <div key={`${key}-label`} className="flex items-center border-t border-white/5 pt-4 text-[13px] text-slate-400">{label}</div>
                        {records.map((r) => {
                          const dim = r.result.dimensions.find((d) => d.key === key);
                          const isBest = Math.max(...records.map((x) => x.result.dimensions.find((d) => d.key === key)?.score ?? 0)) === dim?.score;
                          return (
                            <div key={`${r.id}-${key}`} className="border-t border-white/5 pt-4">
                              <div className="flex items-baseline justify-between">
                                <span className="font-display text-xl font-bold" style={{ color: scoreColor(dim?.score ?? 0) }}>{dim?.score ?? '—'}</span>
                                {isBest && records.length > 1 && <span className="text-[10px] uppercase tracking-wider text-emerald-400/70">best</span>}
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                                <div className="h-full rounded-full" style={{ width: `${dim?.score ?? 0}%`, background: `linear-gradient(90deg, ${scoreColor(dim?.score ?? 0)}55, ${scoreColor(dim?.score ?? 0)})` }} />
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ))}

                    <div className="flex items-center border-t border-white/5 pt-4 text-[13px] text-slate-400">High-priority fixes</div>
                    {records.map((r) => (
                      <div key={`${r.id}-recs`} className="border-t border-white/5 pt-4 text-center">
                        <p className="font-display text-xl font-bold text-rose-300">{r.result.recommendations.filter((x) => x.priority === 'high').length}</p>
                        <Link to={`/report/${r.id}/improve`} className="mt-1 inline-block text-[11px] text-iris-300 hover:text-iris-200">View plan →</Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
