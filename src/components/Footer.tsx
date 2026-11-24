import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Logo } from './Navbar';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Resume Analyzer', to: '/analyzer' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Compare Reports', to: '/compare' },
      { label: 'Resume Builder', to: '/analyzer' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'How It Works', to: '/#how-it-works' },
      { label: 'Features', to: '/#features' },
      { label: 'FAQ', to: '/#faq' },
      { label: 'ATS Guide', to: '/#how-it-works' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', to: '/login' },
      { label: 'Create Account', to: '/login' },
      { label: 'Profile Settings', to: '/dashboard' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-950/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-iris-500/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              A transparent, rule-based ATS analysis engine. Every score is computed from your actual resume
              text and the job description you target — never randomly generated.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Mail, label: 'Email' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 transition-all hover:border-iris-400/40 hover:bg-iris-500/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-slate-500 transition-colors hover:text-iris-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ATS Resume Analyzer. Built for students, freshers and professionals.
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Engine online
            </span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
