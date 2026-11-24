import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, ShieldCheck, Search, Target, Lightbulb, MessageSquareQuote,
  FileSearch, BarChart3, Bot, Upload, Zap, CheckCircle2, TrendingUp, Star,
  ChevronRight, Cpu, Lock, Gauge,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import Accordion from '../components/Accordion';
import ScoreGauge from '../components/ScoreGauge';
import { useAuth } from '../contexts/AuthContext';

const STATS = [
  { value: '7', label: 'Scoring dimensions', sub: 'transparent weighted rubric' },
  { value: '19', label: 'Target roles supported', sub: 'engineering to finance' },
  { value: '250+', label: 'Skills & keywords tracked', sub: 'mined from your resume' },
  { value: '0', label: 'Random scores generated', sub: '100% deterministic engine' },
];

const FEATURES = [
  {
    icon: Gauge,
    title: 'ATS Compatibility Score',
    desc: 'A weighted 0–100 score across formatting, keywords, skills, experience, education, structure and readability — with the exact rule behind every point.',
  },
  {
    icon: Search,
    title: 'Resume Keyword Matching',
    desc: 'See which role keywords you already hit, how often, and which high-signal terms are missing from your document.',
  },
  {
    icon: Target,
    title: 'Job Description Analysis',
    desc: 'Paste any posting to get a compatibility score, required skills found vs. missing, and an experience-years verdict.',
  },
  {
    icon: Cpu,
    title: 'Missing Skills Detection',
    desc: 'The engine mines 250+ technologies, tools and methodologies from the job description and flags the gaps you need to close.',
  },
  {
    icon: Lightbulb,
    title: 'Improvement Suggestions',
    desc: 'Prioritised, section-specific fixes with before/after rewrites written from your own bullet points — not generic advice.',
  },
  {
    icon: MessageSquareQuote,
    title: 'Professional Feedback',
    desc: 'Weak action verbs, unquantified achievements, buzzwords, spelling issues and formatting risks, all in one report.',
  },
];

const STEPS = [
  {
    icon: Upload,
    title: 'Upload or paste your resume',
    desc: 'Drop a PDF or DOCX — text is extracted right in your browser — or paste the text manually. Pick your target role and add the job description you are aiming for.',
  },
  {
    icon: Bot,
    title: 'The rule engine scores it',
    desc: 'Your resume is parsed into sections, mined for skills and keywords, then scored against a transparent 7-dimension rubric and the language of the posting.',
  },
  {
    icon: TrendingUp,
    title: 'Fix, rebuild and re-check',
    desc: 'Work through prioritised recommendations, rewrite bullets in the resume builder, export a polished PDF and re-analyze to watch your score climb.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The keyword gap list was brutal but exactly what I needed. I added six terms I genuinely had experience with and moved from a 61 to an 89 in two passes.',
    name: 'Ananya R.',
    role: 'Final-year CSE student',
    initials: 'AR',
  },
  {
    quote:
      'I had no idea my two-column layout was scrambling my experience in the ATS. One structural fix and I finally started getting screening calls.',
    name: 'Marcus T.',
    role: 'Frontend Developer, 3 yrs',
    initials: 'MT',
  },
  {
    quote:
      'The before/after rewrites are the killer feature. It rewrote my own bullets with strong verbs and left placeholders for the metrics I actually knew.',
    name: 'Sneha K.',
    role: 'Data Analyst, career switcher',
    initials: 'SK',
  },
];

const FAQS = [
  {
    q: 'How is the ATS score actually calculated?',
    a: 'Every score comes from a deterministic rule engine. Your resume is parsed into sections, then seven weighted dimensions are evaluated: ATS Formatting (20%), Keyword Optimization (18%), Skills Match (15%), Work Experience (15%), Section Structure (12%), Readability (12%) and Education (8%). Each dimension is a checklist of pass/fail rules with point values — the report shows every rule and the points you earned, so nothing is hidden or random.',
  },
  {
    q: 'Is my resume text uploaded anywhere?',
    a: 'Text extraction from PDF and DOCX happens entirely in your browser. Only the extracted text, your target role and the optional job description are sent to our API to run the analysis and save it to your history.',
  },
  {
    q: 'Do you use an AI model to write the feedback?',
    a: 'The analysis engine is rule-based and deterministic — no external AI API is configured, so we never present model output as if it were measured fact. Recommendations are generated from patterns detected in your own text, including real before/after rewrites of your own bullet points.',
  },
  {
    q: 'What file types can I analyze?',
    a: 'PDF, DOCX and plain text, up to 8 MB. Scanned or image-only PDFs contain no selectable text, so the analyzer will ask you to paste the text manually instead of guessing.',
  },
  {
    q: 'How does the job description comparison work?',
    a: 'The engine mines skills, tools and soft-skill language from the posting, mirrors its keyword frequency, extracts any stated minimum years of experience, and compares all of it against your resume. The compatibility score is a weighted blend of hard-skill coverage, keyword mirroring, soft-skill evidence and experience fit.',
  },
  {
    q: 'Can I compare different versions of my resume?',
    a: 'Yes. Every analysis is stored in your history, and the Compare view puts up to three reports side by side across all seven dimensions so you can see which version performs best.',
  },
];

/* ------------------------- Hero visual ------------------------- */

function ResumeScanMock() {
  const keywords = ['React', 'TypeScript', 'CI/CD', 'REST API', 'Docker', 'Unit testing'];
  return (
    <div className="relative mx-auto w-full max-w-[330px]">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="glass-strong relative overflow-hidden rounded-2xl p-5 shadow-2xl shadow-black/50"
      >
        {/* scanning line */}
        <div className="pointer-events-none absolute left-0 right-0 h-16 animate-scan bg-gradient-to-b from-transparent via-iris-500/25 to-transparent" />
        <div className="pointer-events-none absolute left-0 right-0 h-[2px] animate-scan bg-gradient-to-r from-transparent via-electric-400 to-transparent shadow-[0_0_18px_rgba(96,165,250,0.9)]" />

        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-electric-400 to-iris-500" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-3/5 rounded bg-white/25" />
            <div className="h-1.5 w-2/5 rounded bg-white/10" />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {['summary', 'skills', 'experience'].map((sec) => (
            <div key={sec}>
              <div className="mb-2 h-1.5 w-24 rounded bg-iris-400/50" />
              <div className="space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-electric-400/70" />
                    <div className="h-1.5 rounded bg-white/10" style={{ width: `${88 - i * 14}%` }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {keywords.map((k, i) => (
            <motion.span
              key={k}
              initial={{ opacity: 0.25 }}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.45 }}
              className="chip border-iris-400/30 bg-iris-500/10 text-iris-200"
            >
              {k}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="glass-strong absolute -bottom-8 -right-4 hidden rounded-2xl px-4 py-3 sm:block lg:-right-10"
      >
        <div className="flex items-center gap-2.5">
          <FileSearch className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-[11px] font-semibold text-white">12 keywords matched</p>
            <p className="text-[10px] text-slate-500">3 high-priority gaps found</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="glass-strong absolute -left-4 top-16 hidden rounded-2xl px-4 py-3 sm:block lg:-left-12"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="h-5 w-5 text-amber-300" />
          <div>
            <p className="text-[11px] font-semibold text-white">4 weak verbs replaced</p>
            <p className="text-[10px] text-slate-500">before / after generated</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? '/analyzer' : '/login';

  return (
    <div className="relative overflow-hidden bg-ink-950">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-iris-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute right-[-200px] top-[420px] h-[420px] w-[420px] rounded-full bg-electric-600/15 blur-[120px]" />

      {/* ---------------- HERO ---------------- */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pt-40 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-iris-400/25 bg-iris-500/10 px-3.5 py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-iris-300" />
              <span className="text-xs font-medium text-iris-200">
                Deterministic ATS engine · 7-dimension scoring
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Your Resume Deserves<br className="hidden sm:block" /> to Get{' '}
              <span className="gradient-text">Noticed.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              Upload your resume and our analysis engine reads it the way an applicant tracking
              system does — scoring formatting, keywords, skills and structure against your target
              job, then handing you the exact fixes that move the needle.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link to={primaryHref} className="btn-primary w-full sm:w-auto">
                Analyze My Resume
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="btn-ghost w-full sm:w-auto">
                Explore Features
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                In-browser text extraction
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                No random scores — every point is auditable
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
                PDF analysis report
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-strong rounded-3xl p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-iris-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Live dashboard preview
                  </span>
                </div>
                <span className="chip border-white/10 bg-white/[0.03] text-slate-400">SAMPLE</span>
              </div>

              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                <ScoreGauge score={87} size={168} label="ATS Score" sublabel="Excellent" />

                <div className="w-full flex-1 space-y-2.5">
                  {[
                    { label: 'ATS Formatting', value: 92 },
                    { label: 'Keyword Optimization', value: 81 },
                    { label: 'Skills Match', value: 88 },
                    { label: 'Work Experience', value: 94 },
                  ].map((d, i) => (
                    <div key={d.label}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{d.label}</span>
                        <span className="font-mono text-slate-500">{d.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${d.value}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.12, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-glow"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <ResumeScanMock />
            </div>
          </motion.div>
        </div>

        {/* stats strip */}
        <Reveal delay={0.1} className="mt-20">
          <div className="glass grid grid-cols-2 divide-white/5 rounded-2xl sm:grid-cols-4 sm:divide-x">
            {STATS.map((s) => (
              <div key={s.label} className="px-5 py-6 text-center sm:px-4">
                <p className="font-display text-3xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-[13px] font-medium text-slate-300">{s.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-600">{s.sub}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip border-iris-400/25 bg-iris-500/10 text-iris-200">Features</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything an ATS checks, in one report
            </h2>
            <p className="mt-4 text-slate-400">
              Six analysis layers that mirror how recruiters and parsing engines actually evaluate
              your resume.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <div className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-iris-400/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500/20 to-iris-600/20 text-iris-300 ring-1 ring-inset ring-white/10 transition-colors group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how-it-works" className="relative border-y border-white/5 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="chip border-electric-400/25 bg-electric-500/10 text-electric-300">
                How it works
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                From upload to interview-ready in three steps
              </h2>
            </div>
          </Reveal>

          <div className="relative mt-14 grid gap-8 lg:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-iris-500/30 to-transparent lg:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.12}>
                <div className="relative glass h-full rounded-2xl p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-500 to-iris-600 text-white shadow-lg shadow-iris-600/30">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-4xl font-bold text-white/10">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section id="reviews" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip border-violet-glow/25 bg-violet-glow/10 text-purple-200">
              Reviews
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Scores that actually moved
            </h2>
            <p className="mt-4 text-sm text-slate-500">Illustrative feedback from early users of the analyzer.</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="glass h-full rounded-2xl p-6">
                <div className="flex gap-0.5 text-amber-300">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-slate-300">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-electric-400 to-iris-600 text-xs font-bold text-white">
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="relative border-t border-white/5 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <span className="chip border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
                FAQ
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Questions, answered honestly
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <Accordion items={FAQS} />
          </Reveal>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-iris-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-electric-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Find out what the ATS sees
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                Upload a resume, paste a job description and get a complete, auditable scorecard in
                under a minute.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={primaryHref} className="btn-primary">
                  Analyze My Resume
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="btn-ghost">
                  Create a free account
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
                {['No credit card', 'Unlimited re-analyses', 'Downloadable PDF report'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
