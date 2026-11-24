import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Loader2, AlertCircle, Save, Download, Plus, X, ArrowLeft, Sparkles, FileText,
  GraduationCap, Award, Briefcase, User, Check, Eye,
} from 'lucide-react';
import { api } from '../lib/api';
import type { AnalysisRecord, ResumeDraft } from '../types';
import { downloadResumePdf } from '../lib/resumePdf';

const uid = () => Math.random().toString(36).slice(2, 9);

const emptyDraft = (): ResumeDraft => ({
  analysis_id: null,
  title: 'My improved resume',
  full_name: '', headline: '', email: '', phone: '', location: '',
  links: [], summary: '', skills: [], experience: [], education: [], certifications: [],
});

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [draft, setDraft] = useState<ResumeDraft>(emptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ResumeDraft>(key: K, value: ResumeDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getAnalysis(id), api.getResume(id)])
      .then(([rec, existing]) => {
        setRecord(rec);
        const prior = existing.find((e) => e.analysis_id === id);
        if (prior) { setDraft(prior); return; }
        // Seed a starting draft from the analyzed resume text.
        const lines = rec.resume_text.split('\n').map((l) => l.trim()).filter(Boolean);
        const email = rec.resume_text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] ?? '';
        const phone = rec.resume_text.match(/(\+?\d[\d\s-]{7,}\d)/)?.[0] ?? '';
        const linkedin = rec.resume_text.match(/linkedin\.com\/[a-z0-9/_-]+/i)?.[0] ?? '';
        const topSkills = rec.result.stats.matchedSkills.slice(0, 12);
        const suggestion = rec.result.recommendations.find((r) => r.section === 'Professional Summary');
        const summary = suggestion?.after ?? rec.result.quality.sectionCompleteness.find((s) => s.section === 'Professional Summary')?.note ?? '';
        setDraft({
          ...emptyDraft(),
          analysis_id: id,
          title: `Improved — ${rec.title}`,
          full_name: (rec.result.meta.fileName || '').replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ').slice(0, 40) || lines[0]?.slice(0, 40) || '',
          headline: `${rec.result.meta.roleLabel}`,
          email, phone, location: '',
          links: linkedin ? [{ label: 'LinkedIn', url: linkedin }] : [],
          summary: summary.replace(/\[.*?\]/g, '').trim(),
          skills: topSkills.map((s) => ({ id: uid(), name: s, category: 'Technical' })),
          experience: [{
            id: uid(), role: 'Your most recent role', company: '', location: '', start: '', end: '',
            bullets: rec.result.quality.weakVerbs.length ? [] : [''],
          }],
          education: [{ id: uid(), degree: '', institution: '', field: '', year: '', detail: '' }],
          certifications: [],
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this analysis.'))
      .finally(() => setLoading(false));
  }, [id]);

  const missingKeywords = useMemo(() => record?.result.keywords.recommended.slice(0, 10).map((k) => k.term) ?? [], [record]);
  const [newSkill, setNewSkill] = useState('');

  const addSkill = (name: string, category = 'Technical') => {
    if (!name.trim()) return;
    set('skills', [...draft.skills, { id: uid(), name: name.trim(), category }]);
    setNewSkill('');
  };

  const save = async () => {
    setError(null);
    if (!draft.full_name.trim()) { setError('Add your full name before saving.'); return; }
    if (!draft.summary.trim()) { setError('Write a professional summary — it carries your most important keywords.'); return; }
    setSaving(true);
    try {
      const savedDraft = await api.saveResume({ ...draft, analysis_id: id ?? null });
      setDraft(savedDraft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your resume.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 pt-24">
        <div className="flex flex-col items-center gap-3"><Loader2 className="h-7 w-7 animate-spin text-iris-400" /><p className="text-sm text-slate-500">Preparing your workspace…</p></div>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 pt-24">
        <div className="glass-strong max-w-md rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
          <h2 className="mt-4 font-display text-lg font-semibold text-white">Builder unavailable</h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <Link to="/dashboard" className="btn-primary mt-6 w-full">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-ink-950 pb-20 pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 grid-bg" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to={`/report/${id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to report
        </Link>

        <div className="glass-strong flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
          <div>
            <span className="chip border-iris-400/25 bg-iris-500/10 text-iris-200"><Sparkles className="h-3 w-3" /> Resume Builder</span>
            <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">Improve &amp; export your resume</h1>
            <p className="mt-1.5 text-sm text-slate-400">Everything you edit here is saved to your account and exportable as an ATS-friendly PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={save} disabled={saving} className="btn-primary !py-2.5 !text-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved' : 'Save Resume'}
            </button>
            <button onClick={() => downloadResumePdf(draft)} className="btn-ghost !py-2.5 !text-sm"><Download className="h-4 w-4" /> Export PDF</button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3.5 text-[13px] text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* ------------- editor ------------- */}
          <div className="space-y-5">
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><User className="h-5 w-5 text-iris-300" /> Header</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Full name" value={draft.full_name} onChange={(e) => set('full_name', e.target.value)} />
                <input className="field" placeholder="Headline (e.g. Frontend Developer)" value={draft.headline} onChange={(e) => set('headline', e.target.value)} />
                <input className="field" placeholder="Email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
                <input className="field" placeholder="Phone" value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
                <input className="field" placeholder="City, Country" value={draft.location} onChange={(e) => set('location', e.target.value)} />
                <input className="field" placeholder="LinkedIn or portfolio URL" value={draft.links[0]?.url ?? ''} onChange={(e) => set('links', e.target.value ? [{ label: 'Profile', url: e.target.value }] : [])} />
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><FileText className="h-5 w-5 text-iris-300" /> Professional summary</h2>
              <textarea className="field mt-4 resize-y !text-[13px]" rows={5} placeholder="2–3 lines naming your role, years of experience, core stack and one measurable win." value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
              {record?.result.recommendations.find((r) => r.section === 'Professional Summary')?.after && (
                <button
                  onClick={() => set('summary', record.result.recommendations.find((r) => r.section === 'Professional Summary')!.after ?? '')}
                  className="mt-3 w-full rounded-xl border border-dashed border-iris-400/30 bg-iris-500/[0.07] px-3 py-2 text-xs text-iris-200 transition-colors hover:bg-iris-500/15"
                >
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5" /> Insert the suggested rewrite from your analysis
                </button>
              )}
            </div>

            <div className="glass-strong rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Sparkles className="h-5 w-5 text-iris-300" /> Skills</h2>
                <span className="text-xs text-slate-600">{draft.skills.length} added</span>
              </div>
              <div className="mt-4 flex gap-2">
                <input className="field" placeholder="Add a skill and press Enter" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }} />
                <button onClick={() => addSkill(newSkill)} className="btn-ghost !px-3 !py-2"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.skills.map((s) => (
                  <span key={s.id} className="chip border-iris-400/25 bg-iris-500/10 text-iris-200">
                    {s.name}
                    <button onClick={() => set('skills', draft.skills.filter((x) => x.id !== s.id))} className="ml-1 text-slate-500 hover:text-rose-300"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              {missingKeywords.length > 0 && (
                <div className="mt-5 border-t border-white/5 pt-4">
                  <p className="text-[11px] uppercase tracking-wider text-slate-600">Suggested from your analysis — click to add</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {missingKeywords.map((k) => (
                      <button key={k} onClick={() => addSkill(k, 'Recommended')} className="chip border-white/10 bg-white/[0.02] text-slate-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-200">+ {k}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-strong rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Briefcase className="h-5 w-5 text-iris-300" /> Experience</h2>
                <button onClick={() => set('experience', [...draft.experience, { id: uid(), role: '', company: '', location: '', start: '', end: '', bullets: [''] }])} className="btn-ghost !px-3 !py-1.5 !text-xs"><Plus className="h-3.5 w-3.5" /> Add role</button>
              </div>
              <div className="mt-4 space-y-4">
                {draft.experience.map((exp, i) => (
                  <div key={exp.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="chip border-white/10 bg-white/[0.03] text-slate-500">Role {i + 1}</span>
                      {draft.experience.length > 1 && (
                        <button onClick={() => set('experience', draft.experience.filter((x) => x.id !== exp.id))} className="text-slate-600 hover:text-rose-300"><X className="h-4 w-4" /></button>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      <input className="field" placeholder="Job title" value={exp.role} onChange={(e) => set('experience', draft.experience.map((x) => x.id === exp.id ? { ...x, role: e.target.value } : x))} />
                      <input className="field" placeholder="Company" value={exp.company} onChange={(e) => set('experience', draft.experience.map((x) => x.id === exp.id ? { ...x, company: e.target.value } : x))} />
                      <input className="field" placeholder="Start (e.g. Jan 2023)" value={exp.start} onChange={(e) => set('experience', draft.experience.map((x) => x.id === exp.id ? { ...x, start: e.target.value } : x))} />
                      <input className="field" placeholder="End (e.g. Present)" value={exp.end} onChange={(e) => set('experience', draft.experience.map((x) => x.id === exp.id ? { ...x, end: e.target.value } : x))} />
                    </div>
                    <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-600">Achievement bullets</p>
                    <div className="mt-2 space-y-2">
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} className="flex gap-2">
                          <textarea className="field resize-y !text-[12.5px]" rows={2} placeholder="Strong verb + what you did + measurable result" value={b}
                            onChange={(e) => set('experience', draft.experience.map((x) => x.id === exp.id ? { ...x, bullets: x.bullets.map((bb, idx) => idx === bi ? e.target.value : bb) } : x))} />
                          {exp.bullets.length > 1 && (
                            <button onClick={() => set('experience', draft.experience.map((x) => x.id === exp.id ? { ...x, bullets: x.bullets.filter((_, idx) => idx !== bi) } : x))} className="mt-1 text-slate-600 hover:text-rose-300"><X className="h-4 w-4" /></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => set('experience', draft.experience.map((x) => x.id === exp.id ? { ...x, bullets: [...x.bullets, ''] } : x))} className="mt-2 text-xs text-iris-300 hover:text-iris-200">+ Add bullet</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><GraduationCap className="h-5 w-5 text-iris-300" /> Education</h2>
                <button onClick={() => set('education', [...draft.education, { id: uid(), degree: '', institution: '', field: '', year: '', detail: '' }])} className="btn-ghost !px-3 !py-1.5 !text-xs"><Plus className="h-3.5 w-3.5" /> Add</button>
              </div>
              <div className="mt-4 space-y-4">
                {draft.education.map((ed) => (
                  <div key={ed.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <input className="field" placeholder="Degree (e.g. B.Tech)" value={ed.degree} onChange={(e) => set('education', draft.education.map((x) => x.id === ed.id ? { ...x, degree: e.target.value } : x))} />
                      <input className="field" placeholder="Institution" value={ed.institution} onChange={(e) => set('education', draft.education.map((x) => x.id === ed.id ? { ...x, institution: e.target.value } : x))} />
                      <input className="field" placeholder="Field of study" value={ed.field} onChange={(e) => set('education', draft.education.map((x) => x.id === ed.id ? { ...x, field: e.target.value } : x))} />
                      <input className="field" placeholder="Year (e.g. 2025)" value={ed.year} onChange={(e) => set('education', draft.education.map((x) => x.id === ed.id ? { ...x, year: e.target.value } : x))} />
                    </div>
                    {draft.education.length > 1 && (
                      <button onClick={() => set('education', draft.education.filter((x) => x.id !== ed.id))} className="mt-2 text-xs text-slate-600 hover:text-rose-300">Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Award className="h-5 w-5 text-iris-300" /> Certifications</h2>
              <div className="mt-4 space-y-2">
                {draft.certifications.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="field" placeholder="Certification or course" value={c} onChange={(e) => set('certifications', draft.certifications.map((x, idx) => idx === i ? e.target.value : x))} />
                    <button onClick={() => set('certifications', draft.certifications.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-rose-300"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button onClick={() => set('certifications', [...draft.certifications, ''])} className="text-xs text-iris-300 hover:text-iris-200">+ Add certification</button>
              </div>
            </div>
          </div>

          {/* ------------- preview ------------- */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="glass-strong rounded-3xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Eye className="h-5 w-5 text-iris-300" /> Live preview</h2>
                <span className="chip border-white/10 bg-white/[0.03] text-slate-500">Single column · ATS safe</span>
              </div>
              <div className="max-h-[820px] overflow-auto rounded-2xl bg-white p-7 text-slate-800 shadow-2xl">
                <p className="font-display text-2xl font-bold text-slate-900">{draft.full_name || 'Your Name'}</p>
                {draft.headline && <p className="mt-0.5 text-[13px] font-medium text-blue-700">{draft.headline}</p>}
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {[draft.location, draft.email, draft.phone, draft.links[0]?.url].filter(Boolean).join('  |  ')}
                </p>

                {draft.summary && (
                  <section className="mt-5">
                    <p className="border-b border-slate-200 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Professional Summary</p>
                    <p className="mt-2 text-[11.5px] leading-relaxed">{draft.summary}</p>
                  </section>
                )}

                {draft.skills.length > 0 && (
                  <section className="mt-5">
                    <p className="border-b border-slate-200 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Technical Skills</p>
                    <p className="mt-2 text-[11.5px] leading-relaxed">{draft.skills.map((s) => s.name).join(', ')}</p>
                  </section>
                )}

                {draft.experience.some((e) => e.role || e.company) && (
                  <section className="mt-5">
                    <p className="border-b border-slate-200 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Professional Experience</p>
                    {draft.experience.filter((e) => e.role || e.company).map((e) => (
                      <div key={e.id} className="mt-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[12.5px] font-bold text-slate-900">{e.role || 'Role'}</p>
                          <p className="shrink-0 text-[11px] text-slate-500">{[e.start, e.end].filter(Boolean).join(' – ')}</p>
                        </div>
                        <p className="text-[11.5px] italic text-slate-600">{[e.company, e.location].filter(Boolean).join(', ')}</p>
                        <ul className="mt-1.5 space-y-1">
                          {e.bullets.filter(Boolean).map((b, i) => (
                            <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-blue-600" />{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                )}

                {draft.education.some((e) => e.degree || e.institution) && (
                  <section className="mt-5">
                    <p className="border-b border-slate-200 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Education</p>
                    {draft.education.filter((e) => e.degree || e.institution).map((e) => (
                      <div key={e.id} className="mt-2.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[12.5px] font-bold text-slate-900">{e.degree || 'Degree'}</p>
                          <p className="shrink-0 text-[11px] text-slate-500">{e.year}</p>
                        </div>
                        <p className="text-[11.5px] italic text-slate-600">{[e.institution, e.field].filter(Boolean).join(' — ')}</p>
                      </div>
                    ))}
                  </section>
                )}

                {draft.certifications.filter(Boolean).length > 0 && (
                  <section className="mt-5">
                    <p className="border-b border-slate-200 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Certifications</p>
                    <ul className="mt-2 space-y-1">
                      {draft.certifications.filter(Boolean).map((c, i) => (
                        <li key={i} className="flex gap-2 text-[11.5px]"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-blue-600" />{c}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
              <button onClick={() => downloadResumePdf(draft)} className="btn-primary mt-5 w-full !py-3"><Download className="h-4 w-4" /> Export this resume as PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
