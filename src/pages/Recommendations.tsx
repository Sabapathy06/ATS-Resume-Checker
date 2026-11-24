import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Lightbulb, Copy, Check, Download, ArrowLeft, PencilRuler, ArrowRight, Filter, Wand2 } from 'lucide-react';
import { api } from '../lib/api';
import type { AnalysisRecord } from '../types';
import { copyToClipboard, priorityClass } from '../lib/format';

export default function Recommendations() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getAnalysis(id)
      .then(setRecord)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this report.'))
      .finally(() => setLoading(false));
  }, [id]);

  const sections = useMemo(() => {
    if (!record) return [];
    return Array.from(new Set(record.result.recommendations.map((r) => r.section)));
  }, [record]);

  const visible = useMemo(() => {
    if (!record) return [];
    return filter === 'all' ? record.result.recommendations : record.result.recommendations.filter((r) => r.section === filter);
  }, [record, filter]);

  const copyAll = async () => {
    if (!record) return;
    const text = record.result.recommendations
      .map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.title} (${r.section})\n${r.description}${r.before ? `\nBEFORE: ${r.before}` : ''}${r.after ? `\nAFTER:  ${r.after}` : ''}${r.note ? `\nNOTE:   ${r.note}` : ''}`)
      .join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2200); }
  };

  const copyOne = async (text: string) => { await copyToClipboard(text); };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 pt-24">
        <div className="flex flex-col items-center gap-3"><Loader2 className="h-7 w-7 animate-spin text-iris-400" /><p className="text-sm text-slate-500">Loading recommendations…</p></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 pt-24">
        <div className="glass-strong max-w-md rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
          <h2 className="mt-4 font-display text-lg font-semibold text-white">Recommendations unavailable</h2>
          <p className="mt-2 text-sm text-slate-400">{error ?? 'This analysis could not be found.'}</p>
          <Link to="/dashboard" className="btn-primary mt-6 w-full">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const counts = {
    high: record.result.recommendations.filter((r) => r.priority === 'high').length,
    medium: record.result.recommendations.filter((r) => r.priority === 'medium').length,
    low: record.result.recommendations.filter((r) => r.priority === 'low').length,
  };

  return (
    <div className="relative min-h-screen bg-ink-950 pb-20 pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 grid-bg" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[640px] -translate-x-1/2 rounded-full bg-violet-glow/12 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link to={`/report/${id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to report
        </Link>

        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <span className="chip border-violet-glow/25 bg-violet-glow/10 text-purple-200"><Wand2 className="h-3 w-3" /> AI-Powered Recommendations</span>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">Improvement plan</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Every suggestion below is generated from a pattern detected in your resume — including rewrites of
                your own bullet points. Work top to bottom; high priority items move your score the most.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={copyAll} className="btn-ghost !py-2.5 !text-sm">{copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy Suggestions'}</button>
              <button onClick={() => import('../lib/reportPdf').then((m) => m.downloadAnalysisReport(record.result, record.title))} className="btn-ghost !py-2.5 !text-sm"><Download className="h-4 w-4" /> Download Report</button>
              <Link to={`/report/${id}/builder`} className="btn-primary !py-2.5 !text-sm"><PencilRuler className="h-4 w-4" /> Apply in Builder</Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {(['high', 'medium', 'low'] as const).map((p) => (
              <span key={p} className={`chip ${priorityClass(p)}`}>{counts[p]} {p} priority</span>
            ))}
            <span className="chip border-white/10 bg-white/[0.03] text-slate-400">Score {record.overall_score}/100</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500"><Filter className="h-3.5 w-3.5" /> Section</span>
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'border-iris-400/40 bg-iris-500/15 text-iris-200' : 'border-white/10 bg-white/[0.02] text-slate-500'}`}>All ({record.result.recommendations.length})</button>
          {sections.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`chip ${filter === s ? 'border-iris-400/40 bg-iris-500/15 text-iris-200' : 'border-white/10 bg-white/[0.02] text-slate-500'}`}>{s}</button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {visible.map((rec, i) => (
            <motion.div key={rec.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }} className="glass rounded-3xl p-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`chip ${priorityClass(rec.priority)}`}>{rec.priority} priority</span>
                <span className="chip border-white/10 bg-white/[0.03] text-slate-400">{rec.section}</span>
                {rec.tags?.map((t) => (<span key={t} className="chip border-white/5 bg-white/[0.02] text-slate-600">#{t}</span>))}
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-white">{rec.title}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{rec.description}</p>

              {(rec.before || rec.after) && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-300">Before</p>
                      {rec.before && rec.before !== '(no summary section present)' && (
                        <button onClick={() => copyOne(rec.before!)} className="text-slate-500 transition-colors hover:text-white" aria-label="Copy before text"><Copy className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                    <p className="mt-2 font-mono text-[12px] leading-relaxed text-slate-400">{rec.before || '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">After</p>
                      {rec.after && (<button onClick={() => copyOne(rec.after!)} className="text-slate-500 transition-colors hover:text-white" aria-label="Copy improved text"><Copy className="h-3.5 w-3.5" /></button>)}
                    </div>
                    <p className="mt-2 font-mono text-[12px] leading-relaxed text-emerald-100/90">{rec.after || '—'}</p>
                  </div>
                </div>
              )}

              {rec.note && (
                <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-500"><Lightbulb className="mr-1.5 inline h-3.5 w-3.5 text-amber-300" />{rec.note}</p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="glass-strong mt-8 flex flex-col items-center gap-4 rounded-3xl p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Apply these fixes in the resume builder</h3>
            <p className="mt-1 text-sm text-slate-500">Edit your summary, skills and bullets, preview the result and export a polished PDF.</p>
          </div>
          <Link to={`/report/${id}/builder`} className="btn-primary !py-2.5 !text-sm">Open Builder <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}
