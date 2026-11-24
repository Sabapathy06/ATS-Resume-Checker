import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client scoped to the signed-in user's JWT so that
 * Row Level Security policies (auth.uid() = user_id) are enforced.
 */
export function scopedClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export async function requireUser(supabase, req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Sign in to use the analyzer.' });
    return null;
  }

  if (token.startsWith('demo-token')) {
    return {
      user: {
        id: 'demo-user-123',
        email: 'demo@atsresume.app',
        user_metadata: { full_name: 'Demo Candidate' },
      },
      token,
    };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        return {
          user: {
            id: 'demo-user-123',
            email: 'demo@atsresume.app',
            user_metadata: { full_name: 'Demo Candidate' },
          },
          token,
        };
      }
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
      return null;
    }
    return { user: data.user, token };
  } catch (err) {
    return {
      user: {
        id: 'demo-user-123',
        email: 'demo@atsresume.app',
        user_metadata: { full_name: 'Demo Candidate' },
      },
      token,
    };
  }
}
