import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import supabase from '../lib/supabase';
import type { GoogleUserProfile } from '../lib/googleAuth';
import type { Profile } from '../types';

interface AuthContextValue {
  user: import('@supabase/supabase-js').Session['user'] | null;
  session: import('@supabase/supabase-js').Session | null;
  loading: boolean;
  signInAsDemo: (name?: string, email?: string) => void;
  signInLocally: (email: string, name?: string, provider?: string) => void;
  signInWithGoogleProfile: (profile: GoogleUserProfile) => void;
  signOut: () => Promise<void>;
}

const LOCAL_USER_STORAGE_KEY = 'ats_demo_user_session';
const PROFILE_CACHE_KEY = 'ats_profile_cache';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signInAsDemo: () => {},
  signInLocally: () => {},
  signInWithGoogleProfile: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogleProfile = (profile: GoogleUserProfile) => {
    const userEmail = profile.email.toLowerCase().trim();

    // Check if user has previously saved profile details for this email
    let existingProfile: Partial<Profile> = {};
    try {
      const stored = localStorage.getItem(`ats_profile_${userEmail}`);
      if (stored) existingProfile = JSON.parse(stored);
    } catch {}

    const resolvedName = existingProfile.full_name || profile.name;

    const googleUser = {
      id: profile.id,
      email: profile.email,
      user_metadata: {
        full_name: resolvedName,
        avatar_url: profile.picture,
        provider: 'google',
      },
      app_metadata: { provider: 'google' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as import('@supabase/supabase-js').Session['user'];

    const googleSession = {
      access_token: profile.token,
      refresh_token: 'google-oauth-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: googleUser,
    } as unknown as import('@supabase/supabase-js').Session;

    const updatedProfile: Profile = {
      user_id: profile.id,
      full_name: resolvedName,
      email: profile.email,
      phone: existingProfile.phone || '',
      location: existingProfile.location || '',
      linkedin: existingProfile.linkedin || '',
      target_role: existingProfile.target_role || 'software_engineer',
      career_level: existingProfile.career_level || 'fresher',
      ...existingProfile,
    };

    try {
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(googleSession));
      localStorage.setItem(`ats_profile_${userEmail}`, JSON.stringify(updatedProfile));
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedProfile));
    } catch {}

    setUser(googleUser);
    setSession(googleSession);
    setLoading(false);
  };

  const signInLocally = (email: string, name?: string, provider = 'email') => {
    const userEmail = email.toLowerCase().trim();

    let existingProfile: Partial<Profile> = {};
    try {
      const stored = localStorage.getItem(`ats_profile_${userEmail}`);
      if (stored) existingProfile = JSON.parse(stored);
    } catch {}

    const resolvedName = existingProfile.full_name || name || email.split('@')[0];

    const localUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email,
      user_metadata: { full_name: resolvedName, provider },
      app_metadata: { provider },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as import('@supabase/supabase-js').Session['user'];

    const localSession = {
      access_token: `demo-token-${Date.now()}`,
      refresh_token: 'local-refresh-token',
      expires_in: 86400,
      token_type: 'bearer',
      user: localUser,
    } as unknown as import('@supabase/supabase-js').Session;

    const updatedProfile: Profile = {
      user_id: localUser.id,
      full_name: resolvedName,
      email,
      phone: existingProfile.phone || '',
      location: existingProfile.location || '',
      linkedin: existingProfile.linkedin || '',
      target_role: existingProfile.target_role || 'software_engineer',
      career_level: existingProfile.career_level || 'fresher',
      ...existingProfile,
    };

    try {
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(localSession));
      localStorage.setItem(`ats_profile_${userEmail}`, JSON.stringify(updatedProfile));
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedProfile));
    } catch {}

    setUser(localUser);
    setSession(localSession);
    setLoading(false);
  };

  const signInAsDemo = (name = 'Demo Candidate', email = 'demo@atsresume.app') => {
    signInLocally(email, name, 'demo');
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
  };

  useEffect(() => {
    // 1. Check local session first
    try {
      const stored = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          const userEmail = (parsed.user.email || '').toLowerCase().trim();
          if (userEmail) {
            try {
              const savedProf = localStorage.getItem(`ats_profile_${userEmail}`);
              if (savedProf) {
                const p = JSON.parse(savedProf);
                if (p?.full_name && !p.full_name.includes('Demo Candidate')) {
                  parsed.user.user_metadata = {
                    ...parsed.user.user_metadata,
                    full_name: p.full_name,
                  };
                }
              }
            } catch {}
          }
          setUser(parsed.user);
          setSession(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // 2. Check Supabase session
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
    <AuthContext.Provider
      value={{ user, session, loading, signInAsDemo, signInLocally, signInWithGoogleProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
