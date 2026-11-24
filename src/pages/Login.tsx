import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, BarChart3, FileSearch, AlertCircle, PlayCircle } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInAsDemo } = useAuth();

  const from = (location.state as { from?: string } | null)?.from || '/analyzer';

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const validate = (): string | null => {
    if (isSignUp && fullName.trim().length < 2) return 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    // If using the demo credentials, log in instantly
    if (email.trim().toLowerCase() === 'demo@atsresume.app') {
      signInAsDemo('Demo Candidate', 'demo@atsresume.app');
      navigate(from, { replace: true });
      return;
    }

    setError(null);
    setBusy(true);
    try {
      if (isSignUp) {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (err) throw err;
        setNotice('Account created! You can now sign in with your credentials.');
        setIsSignUp(false);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDemoLogin = () => {
    signInAsDemo('Demo Candidate', 'demo@atsresume.app');
    navigate(from, { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 pt-24 pb-16">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[440px] w-[700px] -translate-x-1/2 rounded-full bg-iris-600/20 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
            Welcome back to your<br />
            <span className="gradient-text">ATS command centre</span>
          </h1>
          <p className="mt-5 max-w-md text-slate-400">
            Sign in to pick up your analysis history, compare resume versions and keep improving your score.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: FileSearch, title: 'Full analysis history', desc: 'Every report is saved and re-openable.' },
              { icon: BarChart3, title: 'Side-by-side comparison', desc: 'Track how each revision scores.' },
              { icon: ShieldCheck, title: 'Private by default', desc: 'Your resumes are only visible to your account.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-iris-400/20 bg-iris-500/10 text-iris-300">
                  <f.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-strong mx-auto w-full max-w-md rounded-3xl p-7 sm:p-9"
        >
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              {isSignUp ? 'Create your account' : 'Sign in'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {isSignUp ? 'Start analyzing resumes with free scoring' : 'Access your saved reports and tools'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    id="name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field !pl-9"
                    placeholder="Priya Mehta"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field !pl-9"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field !pl-9"
                  placeholder="At least 6 characters"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-[13px] text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {notice && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSignUp ? 'Create account' : 'Sign in'}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">or continue with</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDemoLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-iris-500/40 bg-iris-500/15 px-4 py-2.5 text-sm font-semibold text-iris-200 transition-colors hover:bg-iris-500/25 hover:text-white"
            >
              <PlayCircle className="h-4 w-4 text-iris-300" />
              Try Demo Account (Instant Access)
            </button>

            <button onClick={() => signInWithGoogle('ATS Resume Analyzer')} className="btn-ghost w-full">
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp((s) => !s);
                setError(null);
                setNotice(null);
              }}
              className="font-semibold text-iris-300 hover:text-iris-200"
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-slate-600">
            <Link to="/" className="hover:text-slate-400">
              ← Back to homepage
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
