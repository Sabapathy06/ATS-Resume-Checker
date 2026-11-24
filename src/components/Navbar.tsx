import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ScanSearch, GitCompare, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500 via-iris-500 to-violet-glow shadow-lg shadow-iris-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-tight text-white">
          ATS<span className="gradient-text">Resume</span>
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const appLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: false },
    { to: '/analyzer', label: 'Analyze', icon: ScanSearch, end: true },
    { to: '/compare', label: 'Compare', icon: GitCompare, end: true },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors $
     ${isActive ? 'bg-iris-500/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 $
        ${scrolled ? 'glass-strong border-b border-white/10 py-2.5' : 'border-b border-transparent py-4'}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {user ? (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              {appLinks.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-electric-400 to-iris-500 text-[11px] font-bold text-white">
                  {(user.email ?? 'U').charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate text-xs text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <nav className="hidden items-center gap-7 lg:flex">
              {['Features', 'How it works', 'Reviews', 'FAQ'].map((label) => (
                <a key={label} href={`#${label.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
                  {label}
                </a>
              ))}
            </nav>
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost !py-2 !text-sm">
                Sign in
              </Link>
              <Link to="/analyzer" className="btn-primary !py-2 !text-sm">
                Analyze My Resume
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="glass-strong mx-4 mt-2 rounded-2xl border border-white/10 p-3 md:hidden">
          {user ? (
            <div className="space-y-1">
              {appLinks.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={navClass} onClick={() => setOpen(false)}>
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </NavLink>
              ))}
              <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : loading ? (
            <div className="px-3 py-4 text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="space-y-1">
              {['Features', 'How it works', 'Reviews', 'FAQ'].map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
                <Link to="/login" className="btn-ghost w-full" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link to="/analyzer" className="btn-primary w-full" onClick={() => setOpen(false)}>
                  Analyze My Resume
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
