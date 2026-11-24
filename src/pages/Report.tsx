import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, AlertCircle, Download, Lightbulb, PencilRuler, LayoutDashboard, Copy, Check, X,
  FileText, Search, Target, ShieldCheck, ArrowLeft, Layers, BarChart3, Info,
} from 'lucide-react';
import { api } from '../lib/api';
import type { AnalysisRecord } from '../types';
import ScoreGauge from '../components/ScoreGauge';
import RadarChart from '../components/RadarChart';
import DimensionBar from '../components/DimensionBar';
import CheckRow from '../components/CheckRow';
import { categoryClass, copyToClipboard, formatDate, ratingBadgeClass, scoreColor } from '../lib/format';

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'keywords', label: 'Keywords', icon: Search },
  { key: 'jobmatch', label: 'Job Match', icon: Target },
  { key: 'quality', label: 'Quality', icon: ShieldCheck },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');
  const [copied, setCopied] = useState(false);
  const [openDim, setOpenDim] = useState<string | null>('formatting');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getAnalysis(id)
      .then(setRecord)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this report.'))
      .finally(() => setLoading(false));
  }, [id]);

  const copySuggestions = async () => {
    if (!record) return;
    const text = record.result.recommendations
      .map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.title}\n${r.description}${r.before ? `\nBEFORE: ${r.before}` : ''}${r.after ? `\nAFTER: ${r.after}` : ''}`)
      .join('\n\n');
    const ok = await copyToClipboard(`ATS RESUME ANALYSIS — ${record.title}\nScore: ${record.overall_score}/100 (${record.rating})\n\n${text}`);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2200); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 pt-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-iris-400" />
          <p className="text-sm text-slate-500">Loading your analysis…</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 pt-24">
        <div className="glass-strong max-w-md rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
          <h2 className="mt-4 font-display text-lg font-semibold text-white">Report unavailable</h2>
          <p className="mt-2 text-sm text-slate-400">{error ?? 'This analysis could not be found.'}</p>
          <Link to="/dashboard" className="btn-primary mt-6 w-full">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const r = record.result;

  return (
    <div className="relative min-h-screen bg-ink-950 pb-20 pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 grid-bg" />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[680px] -translate-x-1/2 rounded-full bg-iris-600/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All reports
        </Link>

        {/* header */}
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <ScoreGauge score={r.overallScore} size={178} label="Overall ATS Score" sublabel={r.rating} />
              <div className="max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${ratingBadgeClass(r.rating)}`}>{r.rating}</span>
                  <span className="chip border-white/10 bg-white/[0.03] text-slate-400">{r.meta.roleLabel}</span>
                  {r.meta.hasJD && <span className="chip border-emerald-400/30 bg-emerald-500/10 text-emerald-300">JD compared</span>}
                </div>
                <h1 className="mt-3 break-words font-display text-2xl font-bold text-white">{record.title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.ratingDetail}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                  <Info className="h-3.5 w-3.5" />
                  Analyzed {formatDate(record.created_at)} · {r.meta.engine} · {r.stats.wordCount.toLocaleString()} words · {r.stats.bulletCount} bullets
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 lg:items-end">
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-md">
                {[
                  { label: 'Keywords hit', value: `${r.keywords.matched.length}` },
                  { label: 'Skill match', value: r.dimensions.find((d) => d.key === 'skills')?.score ?? '—' },
                  { label: 'Pages', value: r.stats.estimatedPages },
                  { label: 'Experience', value: `${r.stats.resumeYears} yr` },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-center">
                    <p className="font-display text-lg font-bold text-white">{s.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link to={`/report/${id}/improve`} className="btn-primary !py-2.5 !text-sm"><Lightbulb className="h-4 w-4" /> Improve My Resume</Link>
                <Link to={`/report/${id}/builder`} className="btn-ghost !py-2.5 !text-sm"><PencilRuler className="h-4 w-4" /> Resume Builder</Link>
                <button onClick={() => import('../lib/reportPdf').then((m) => m.downloadAnalysisReport(r, record.title))} className="btn-ghost !py-2.5 !text-sm">
                  <Download className="h-4 w-4" /> Download Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? 'bg-iris-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-6">
          {tab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="glass-strong rounded-3xl p-6">
                <h2 className="font-display text-lg font-semibold text-white">Score profile</h2>
                <p className="mt-1 text-sm text-slate-500">Seven weighted dimensions out of 100.</p>
                <div className="mt-4"><RadarChart dimensions={r.dimensions.map((d) => ({ label: d.label, score: d.score }))} /></div>
                <div className="mt-2 space-y-2 border-t border-white/5 pt-4">
                  {r.dimensions.map((d) => (
                    <div key={d.key} className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-400">{d.label}</span>
                      <span className="font-mono font-semibold" style={{ color: scoreColor(d.score) }}>{d.score} · {d.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {r.dimensions.map((d) => (<DimensionBar key={d.key} label={d.label} score={d.score} weight={d.weight} summary={d.summary} />))}
                </div>

                <div className="glass-strong rounded-3xl p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
                    <Layers className="h-5 w-5 text-iris-300" /> Transparent rule breakdown
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Click a dimension to see every rule and the points you earned.</p>
                  <div className="mt-4 space-y-2">
                    {r.dimensions.map((d) => (
                      <div key={d.key} className="overflow-hidden rounded-2xl border border-white/5">
                        <button onClick={() => setOpenDim(openDim === d.key ? null : d.key)} className="flex w-full items-center justify-between gap-3 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.04]">
                          <span className="text-sm font-semibold text-slate-200">{d.label}</span>
                          <span className="font-mono text-xs" style={{ color: scoreColor(d.score) }}>{d.score}/100 · {d.checks.filter((c) => c.passed).length}/{d.checks.length} rules</span>
                        </button>
                        {openDim === d.key && (
                          <div className="px-4 pb-2">
                            {d.checks.map((c) => (<CheckRow key={c.label} check={c} />))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'keywords' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-strong rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Search className="h-5 w-5 text-emerald-300" /> Matched keywords</h2>
                  <span className="chip border-emerald-400/30 bg-emerald-500/10 text-emerald-300">{r.keywords.coverage}% coverage</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.keywords.matched.map((k) => (
                    <span key={k.term} className="chip border-emerald-400/25 bg-emerald-500/10 text-emerald-200">
                      {k.term} <span className="font-mono text-[10px] text-emerald-400/70">{k.count}×</span>
                    </span>
                  ))}
                  {!r.keywords.matched.length && <p className="text-sm text-slate-500">No expected keywords were found in this resume.</p>}
                </div>

                <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wider text-slate-400">Keyword frequency</h3>
                <div className="mt-3 space-y-2">
                  {r.keywords.frequency.slice(0, 10).map((f) => {
                    const max = r.keywords.frequency[0]?.count || 1;
                    return (
                      <div key={f.term} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-[12.5px] text-slate-400">{f.term}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-glow" style={{ width: `${(f.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 shrink-0 text-right font-mono text-[11px] text-slate-600">{f.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-strong rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><AlertCircle className="h-5 w-5 text-rose-300" /> Missing keywords</h2>
                  <span className="chip border-rose-400/30 bg-rose-500/10 text-rose-300">{r.keywords.missing.length} gaps</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.keywords.missing.map((k) => (
                    <span key={k.term} className={`chip ${k.importance === 'high' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>
                      {k.term}
                    </span>
                  ))}
                  {!r.keywords.missing.length && <p className="text-sm text-emerald-300">No keyword gaps detected.</p>}
                </div>

                {r.keywords.recommended.length > 0 && (
                  <>
                    <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wider text-slate-400">Recommended to add first</h3>
                    <p className="mt-1.5 text-xs text-slate-600">Highest-value terms for a {r.meta.roleLabel} application.</p>
                    <div className="mt-3 space-y-2">
                      {r.keywords.recommended.slice(0, 10).map((k) => (
                        <div key={k.term} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                          <span className="text-[13px] font-medium text-slate-200">{k.term}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-600">{k.source === 'both' ? 'role + job' : k.source}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-iris-300" />
                  Keywords are matched literally — an ATS cannot infer a skill you never name. Only add terms you can defend in an interview.
                </div>
              </div>
            </div>
          )}

          {tab === 'jobmatch' && (
            <div>
              {!r.jobMatch.hasJD ? (
                <div className="glass-strong rounded-3xl p-10 text-center">
                  <Target className="mx-auto h-10 w-10 text-slate-600" />
                  <h2 className="mt-4 font-display text-lg font-semibold text-white">No job description was provided</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                    This analysis was scored against the role library only. Re-run it with the job posting pasted in to unlock
                    compatibility scoring, required-skill matching and the experience verdict.
                  </p>
                  <Link to="/analyzer" className="btn-primary mt-6">Analyze again with a job description</Link>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="glass-strong rounded-3xl p-6 text-center">
                    <h2 className="font-display text-lg font-semibold text-white">Job compatibility</h2>
                    <div className="mt-5 flex justify-center"><ScoreGauge score={r.jobMatch.compatibility ?? 0} size={170} label="Match" sublabel={r.jobMatch.compatibility !== null && r.jobMatch.compatibility >= 70 ? 'Strong fit' : 'Needs work'} /></div>
                    <div className="mt-5 space-y-2.5 text-left">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                        <p className="text-[11px] uppercase tracking-wider text-slate-600">Experience verdict</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{r.jobMatch.experienceVerdict}</p>
                      </div>
                      {r.jobMatch.detectedTitle && (
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                          <p className="text-[11px] uppercase tracking-wider text-slate-600">Title in posting</p>
                          <p className="mt-1 text-[13px] text-slate-300">
                            {r.jobMatch.detectedTitle}
                            <span className={`ml-2 chip ${r.jobMatch.titleMatch ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-400/30 bg-amber-500/10 text-amber-300'}`}>
                              {r.jobMatch.titleMatch ? 'mirrored' : 'not mirrored'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-strong rounded-3xl p-6">
                      <h2 className="font-display text-lg font-semibold text-white">Required skills</h2>
                      <p className="mt-1 text-sm text-slate-500">Skills detected in the posting ({r.jobMatch.requiredSkillsFound.length} found in your resume).</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {r.jobMatch.requiredSkillsFound.map((s) => (
                          <span key={s.name} className={`chip ${categoryClass(s.category)}`}>{s.name}</span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="glass-strong rounded-3xl p-6">
                        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-rose-300">Missing technical skills</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {r.jobMatch.missingTechnical.map((s) => (<span key={s.name} className="chip border-rose-400/30 bg-rose-500/10 text-rose-200">{s.name}</span>))}
                          {!r.jobMatch.missingTechnical.length && <p className="text-sm text-emerald-300">Every technical requirement is covered.</p>}
                        </div>
                      </div>
                      <div className="glass-strong rounded-3xl p-6">
                        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-amber-300">Missing soft skills</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {r.jobMatch.missingSoft.map((s) => (<span key={s} className="chip border-amber-400/30 bg-amber-500/10 text-amber-200">{s}</span>))}
                          {!r.jobMatch.missingSoft.length && <p className="text-sm text-emerald-300">All soft-skill language is present.</p>}
                        </div>
                      </div>
                    </div>

                    <div className="glass-strong rounded-3xl p-6">
                      <h2 className="font-display text-lg font-semibold text-white">Posting language</h2>
                      <p className="mt-1 text-sm text-slate-500">Terms this employer repeats that your resume does not contain.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.jobMatch.missingJdKeywords.slice(0, 20).map((k) => (<span key={k} className="chip border-white/10 bg-white/[0.03] text-slate-400">{k}</span>))}
                        {!r.jobMatch.missingJdKeywords.length && <p className="text-sm text-emerald-300">You already mirror this posting's vocabulary.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'quality' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="glass-strong rounded-3xl p-6">
                  <h2 className="font-display text-lg font-semibold text-white">Quantifiable achievements</h2>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-display text-4xl font-bold" style={{ color: scoreColor(Math.round(r.quality.quantified.ratio * 100 * 2.5)) }}>
                      {Math.round(r.quality.quantified.ratio * 100)}%
                    </span>
                    <span className="text-sm text-slate-500">
                      {r.quality.quantified.bulletsWithMetrics}/{r.quality.quantified.totalBullets} bullets contain a metric · {r.quality.quantified.status}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.quality.quantified.ratio * 100 * 2)}%`, background: 'linear-gradient(90deg,#fbbf2455,#fbbf24)' }} />
                  </div>
                  {r.quality.quantified.examples.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] uppercase tracking-wider text-slate-600">Bullets without any number</p>
                      <ul className="mt-2 space-y-1.5">
                        {r.quality.quantified.examples.map((e, i) => (
                          <li key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 font-mono text-[11.5px] leading-relaxed text-slate-400">{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="glass-strong rounded-3xl p-6">
                  <h2 className="font-display text-lg font-semibold text-white">Section completeness</h2>
                  <div className="mt-4 space-y-2">
                    {r.quality.sectionCompleteness.map((s) => (
                      <div key={s.section} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${s.present ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/40 bg-rose-400/10 text-rose-300'}`}>
                          {s.present ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-slate-200">{s.section}</p>
                          <p className="text-xs text-slate-600">{s.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-strong rounded-3xl p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><FileText className="h-5 w-5 text-iris-300" /> Grammar & spelling</h2>
                  {r.quality.grammar.length ? (
                    <div className="mt-4 space-y-2">
                      {r.quality.grammar.map((g, i) => (
                        <div key={i} className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
                          <p className="text-[13px] font-medium text-amber-200">{g.issue}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{g.suggestion}</p>
                          {g.excerpt !== '—' && <p className="mt-1 font-mono text-[11px] text-slate-600">“{g.excerpt}”</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-emerald-300">No spelling, spacing or repetition issues detected by the rule engine.</p>
                  )}
                </div>

                <div className="glass-strong rounded-3xl p-6">
                  <h2 className="font-display text-lg font-semibold text-white">Weak action verbs</h2>
                  {r.quality.weakVerbs.length ? (
                    <div className="mt-4 space-y-3">
                      {r.quality.weakVerbs.map((w) => (
                        <div key={w.phrase} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13px] font-semibold text-rose-200">“{w.phrase}”</p>
                            <span className="font-mono text-[10px] text-slate-600">{w.count}×</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">Try: {w.alternatives.join(' / ')}</p>
                          {w.examples[0] && <p className="mt-1.5 font-mono text-[11px] text-slate-600">“{w.examples[0]}”</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-emerald-300">Every bullet opens with strong, specific action language.</p>
                  )}
                </div>

                <div className="glass-strong rounded-3xl p-6">
                  <h2 className="font-display text-lg font-semibold text-white">Formatting issues</h2>
                  {r.quality.formattingIssues.length ? (
                    <div className="mt-4 space-y-2">
                      {r.quality.formattingIssues.map((f, i) => (
                        <div key={i} className={`rounded-xl border p-3 ${f.severity === 'high' ? 'border-rose-400/25 bg-rose-500/[0.07]' : f.severity === 'medium' ? 'border-amber-400/20 bg-amber-500/[0.05]' : 'border-white/10 bg-white/[0.02]'}`}>
                          <p className="text-[13px] font-medium text-slate-200">{f.issue}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{f.fix}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-emerald-300">No formatting risks detected.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* bottom actions */}
        <div className="glass-strong mt-8 flex flex-col items-center gap-4 rounded-3xl p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">{r.recommendations.length} prioritised recommendations ready</h3>
            <p className="mt-1 text-sm text-slate-500">Section-specific fixes with before/after rewrites written from your own bullets.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button onClick={copySuggestions} className="btn-ghost !py-2.5 !text-sm">{copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy Suggestions'}</button>
            <Link to={`/report/${id}/improve`} className="btn-primary !py-2.5 !text-sm"><Lightbulb className="h-4 w-4" /> Improve My Resume</Link>
            <Link to="/dashboard" className="btn-ghost !py-2.5 !text-sm"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
