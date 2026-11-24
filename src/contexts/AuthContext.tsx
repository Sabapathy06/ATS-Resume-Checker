import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import supabase from '../lib/supabase';

interface AuthContextValue {
  user: import('@supabase/supabase-js').Session['user'] | null;
  session: import('@supabase/supabase-js').Session | null;
  loading: boolean;
  signInAsDemo: (name?: string, email?: string) => void;
  signOut: () => Promise<void>;
}

const DEMO_USER_STORAGE_KEY = 'ats_demo_user_session';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signInAsDemo: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [loading, setLoading] = useState(true);

  const signInAsDemo = (name = 'Demo Candidate', email = 'demo@atsresume.app') => {
    const demoUser = {
      id: 'demo-user-123',
      email,
      user_metadata: { full_name: name },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as import('@supabase/supabase-js').Session['user'];

    const demoSession = {
      access_token: 'demo-token-123',
      refresh_token: 'demo-refresh',
      expires_in: 86400,
      token_type: 'bearer',
      user: demoUser,
    } as unknown as import('@supabase/supabase-js').Session;

    try {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoSession));
    } catch {}

    setUser(demoUser);
    setSession(demoSession);
    setLoading(false);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
  };

  useEffect(() => {
    // Check local demo session first
    try {
      const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          setUser(parsed.user);
          setSession(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Otherwise check Supabase session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user ?? null);
      }
      setLoading(false);
    });

    return () => data?.subscription?.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
