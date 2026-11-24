import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, AlertCircle, FileText, ScanSearch, TrendingUp, Trophy, Trash2, ArrowRight,
  Settings, Save, GitCompare, Sparkles, BarChart3, Check, X, Target,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { AnalysisSummary, Profile } from '../types';
import { formatDate, formatRelative, ratingBadgeClass, scoreColor } from '../lib/format';
import { CAREER_LEVELS, ROLE_OPTIONS } from '../lib/roles';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AnalysisSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'settings'>('overview');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const load = () => {
    Promise.all([api.listAnalyses(), api.getProfile()])
      .then(([list, p]) => {
        setItems(list);
        const resolvedProfile: Profile = {
          ...p,
          email: user?.email || p.email,
          full_name: (p.full_name && !p.full_name.includes('Demo Candidate')) ? p.full_name : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || p.full_name),
        };
        setProfile(resolvedProfile);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your dashboard.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    if (!items.length) return { total: 0, avg: 0, best: null, latest: null, improvement: 0 };
    const avg = Math.round(items.reduce((s, i) => s + i.overall_score, 0) / items.length);
    const best = items.reduce((a, b) => (b.overall_score > a.overall_score ? b : a));
    const latest = items[0];
    const oldest = items[items.length - 1];
    return { total: items.length, avg, best, latest, improvement: latest.overall_score - oldest.overall_score };
  }, [items]);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await api.deleteAnalysis(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setError(null);
    try {
      const saved = await api.saveProfile(profile);
      setProfile(saved);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 pt-24">
        <div className="flex flex-col items-center gap-3"><Loader2 className="h-7 w-7 animate-spin text-iris-400" /><p className="text-sm text-slate-500">Loading your dashboard…</p></div>
      </div>
    );
  }

  const scoreTrend = items.slice(0, 6).reverse();

  return (
    <div className="relative min-h-screen bg-ink-950 pb-20 pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 grid-bg" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[680px] -translate-x-1/2 rounded-full bg-iris-600/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip border-iris-400/25 bg-iris-500/10 text-iris-200"><BarChart3 className="h-3 w-3" /> Dashboard</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-2 text-sm text-slate-400">{user?.email}</p>
          </div>
          <div className="flex gap-2.5">
            <Link to="/compare" className="btn-ghost !py-2.5 !text-sm"><GitCompare className="h-4 w-4" /> Compare reports</Link>
            <Link to="/analyzer" className="btn-primary !py-2.5 !text-sm"><ScanSearch className="h-4 w-4" /> New analysis</Link>
          </div>
        </div>

        <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1 sm:w-fit">
          <button onClick={() => setTab('overview')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors sm:flex-none ${tab === 'overview' ? 'bg-iris-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>
            <BarChart3 className="h-4 w-4" /> Overview
          </button>
          <button onClick={() => setTab('settings')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors sm:flex-none ${tab === 'settings' ? 'bg-iris-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Settings className="h-4 w-4" /> Profile settings
          </button>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3.5 text-[13px] text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {tab === 'overview' ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: FileText, label: 'Resumes analyzed', value: stats.total, sub: 'all-time' },
                { icon: TrendingUp, label: 'Average ATS score', value: stats.avg, sub: 'across all reports', color: scoreColor(stats.avg) },
                { icon: Trophy, label: 'Best score', value: stats.best?.overall_score ?? 0, sub: stats.best ? stats.best.title.slice(0, 26) : 'no data yet', color: scoreColor(stats.best?.overall_score ?? 0) },
                { icon: Sparkles, label: 'Latest vs first', value: stats.improvement >= 0 ? `+${stats.improvement}` : stats.improvement, sub: 'score movement', color: stats.improvement >= 0 ? '#34d399' : '#f87171' },
              ].map((c) => (
                <div key={c.label} className="glass-strong rounded-3xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500/20 to-iris-600/25 text-iris-300"><c.icon className="h-5 w-5" /></span>
                  </div>
                  <p className="mt-4 font-display text-3xl font-bold" style={{ color: c.color ?? '#fff' }}>{c.value}</p>
                  <p className="mt-1 text-[13px] font-medium text-slate-300">{c.label}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-600">{c.sub}</p>
                </div>
              ))}
            </div>

            {items.length > 1 && (
              <div className="glass-strong rounded-3xl p-6">
                <h2 className="font-display text-lg font-semibold text-white">Score trend</h2>
                <p className="mt-1 text-sm text-slate-500">Your six most recent analyses, oldest to newest.</p>
                <div className="mt-6 flex h-40 items-end gap-3">
                  {scoreTrend.map((it, i) => {
                    const max = Math.max(...scoreTrend.map((s) => s.overall_score), 100);
                    return (
                      <button key={it.id} onClick={() => navigate(`/report/${it.id}`)} className="group flex flex-1 flex-col items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500 transition-colors group-hover:text-white">{it.overall_score}</span>
                        <div className="flex w-full flex-1 items-end">
                          <div className="w-full rounded-t-xl transition-all group-hover:brightness-125"
                            style={{ height: `${(it.overall_score / max) * 100}%`, background: `linear-gradient(180deg, ${scoreColor(it.overall_score)}, ${scoreColor(it.overall_score)}40)` }} />
                        </div>
                        <span className="text-[10px] text-slate-600">{formatDate(it.created_at).replace(/ \d+/, '')}</span>
                        <span className="text-[9px] text-slate-700">{i === 0 ? 'oldest' : i === scoreTrend.length - 1 ? 'latest' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="glass-strong rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-white">Recent analyses</h2>
                  <Link to="/compare" className="text-xs text-iris-300 hover:text-iris-200">Compare →</Link>
                </div>

                {items.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                    <ScanSearch className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="mt-3 text-sm text-slate-400">No analyses yet.</p>
                    <p className="mt-1 text-xs text-slate-600">Upload your first resume to start tracking your ATS score.</p>
                    <Link to="/analyzer" className="btn-primary mt-5 !py-2.5 !text-sm">Analyze my resume</Link>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {items.slice(0, 8).map((it) => (
                      <div key={it.id} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-iris-400/25">
                        <Link to={`/report/${it.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                            <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                              <circle cx="22" cy="22" r="18" fill="none" stroke={scoreColor(it.overall_score)} strokeWidth="5" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - it.overall_score / 100)} />
                            </svg>
                            <span className="font-display text-sm font-bold" style={{ color: scoreColor(it.overall_score) }}>{it.overall_score}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{it.title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                              <span>{it.role_label ?? 'General'}</span>·<span>{formatRelative(it.created_at)}</span>·
                              <span>{it.has_jd ? 'JD compared' : 'role only'}</span>
                            </p>
                          </div>
                          <span className={`chip hidden sm:inline-flex ${ratingBadgeClass(it.rating)}`}>{it.rating}</span>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <Link to={`/report/${it.id}/improve`} className="rounded-lg p-2 text-slate-500 opacity-0 transition-all hover:bg-white/5 hover:text-iris-300 group-hover:opacity-100" aria-label="Recommendations"><Sparkles className="h-4 w-4" /></Link>
                          <Link to={`/report/${it.id}/builder`} className="rounded-lg p-2 text-slate-500 opacity-0 transition-all hover:bg-white/5 hover:text-iris-300 group-hover:opacity-100" aria-label="Builder"><FileText className="h-4 w-4" /></Link>
                          <button onClick={() => remove(it.id)} disabled={deleting === it.id}
                            className="rounded-lg p-2 text-slate-500 transition-all hover:bg-rose-500/10 hover:text-rose-300" aria-label="Delete report">
                            {deleting === it.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {stats.best && (
                  <div className="glass-strong rounded-3xl p-6">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-300" />
                      <h2 className="font-display text-lg font-semibold text-white">Best-performing resume</h2>
                    </div>
                    <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                      <p className="font-display text-3xl font-bold" style={{ color: scoreColor(stats.best.overall_score) }}>{stats.best.overall_score}<span className="text-sm text-slate-500">/100</span></p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{stats.best.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{stats.best.role_label} · {formatDate(stats.best.created_at)}</p>
                      <Link to={`/report/${stats.best.id}`} className="btn-ghost mt-4 w-full !py-2 !text-xs">Open report <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </div>
                  </div>
                )}

                <div className="glass-strong rounded-3xl p-6">
                  <div className="flex items-center gap-2"><Target className="h-5 w-5 text-iris-300" /><h2 className="font-display text-lg font-semibold text-white">Your target</h2></div>
                  <div className="mt-4 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Target role</span><span className="font-medium text-slate-200">{ROLE_OPTIONS.find((r) => r.value === profile?.target_role)?.label ?? 'Not set'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Career level</span><span className="font-medium text-slate-200">{CAREER_LEVELS.find((c) => c.value === profile?.career_level)?.label ?? 'Not set'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Reports saved</span><span className="font-medium text-slate-200">{items.length}</span></div>
                  </div>
                  <button onClick={() => setTab('settings')} className="btn-ghost mt-4 w-full !py-2 !text-xs"><Settings className="h-3.5 w-3.5" /> Edit profile</button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="glass-strong mx-auto max-w-2xl rounded-3xl p-6 sm:p-8">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Settings className="h-5 w-5 text-iris-300" /> Profile settings</h2>
              <p className="mt-1 text-sm text-slate-500">Used to pre-fill the analyzer and personalise your recommendations.</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {([
                  { key: 'full_name', label: 'Full name', placeholder: 'e.g. Sabapathy S S' },
                  { key: 'email', label: 'Email', placeholder: 'you@example.com' },
                  { key: 'phone', label: 'Phone', placeholder: 'e.g. +91 98765 43210' },
                  { key: 'location', label: 'Location', placeholder: 'e.g. Chennai, India' },
                  { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'e.g. linkedin.com/in/yourprofile' },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{f.label}</label>
                    <input className="field" placeholder={f.placeholder} value={(profile as never)?.[f.key] ?? ''}
                      onChange={(e) => setProfile((p) => (p ? { ...p, [f.key]: e.target.value } : p))} />
                  </div>
                ))}

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Target role</label>
                  <select className="field cursor-pointer" value={profile?.target_role ?? 'generic'} onChange={(e) => setProfile((p) => (p ? { ...p, target_role: e.target.value } : p))}>
                    {ROLE_OPTIONS.map((r) => (<option key={r.value} value={r.value} className="bg-ink-850">{r.label}</option>))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Career level</label>
                  <select className="field cursor-pointer" value={profile?.career_level ?? 'fresher'} onChange={(e) => setProfile((p) => (p ? { ...p, career_level: e.target.value } : p))}>
                    {CAREER_LEVELS.map((c) => (<option key={c.value} value={c.value} className="bg-ink-850">{c.label}</option>))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button onClick={saveProfile} disabled={savingProfile} className="btn-primary !py-2.5 !text-sm">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : profileSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {profileSaved ? 'Saved' : 'Save profile'}
                </button>
                {profileSaved && <span className="flex items-center gap-1.5 text-xs text-emerald-300"><X className="hidden" />Profile updated</span>}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
