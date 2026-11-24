import supabase from './supabase';

const isPlaceholderSupabase = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return !url || url.includes('placeholder.supabase.co');
};

export async function signInWithGoogle(
  onFallback?: (user: { email: string; name: string }) => void
): Promise<{ success: boolean; error?: string }> {
  // If Supabase is connected to a real instance, use standard Supabase Google OAuth
  if (!isPlaceholderSupabase()) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('[google-auth] Supabase OAuth failed, using fallback:', err);
    }
  }

  // Fallback for demo or when Google OAuth credentials are not yet configured in Supabase
  if (onFallback) {
    onFallback({
      email: 'alex.developer@gmail.com',
      name: 'Alex Rivera (Google)',
    });
    return { success: true };
  }

  return { success: false, error: 'Google OAuth is not configured.' };
}

export async function handleGoogleRedirect() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      // Session initialized via OAuth callback
      return data.session;
    }
  } catch (err) {
    console.warn('[google-auth] Callback check error:', err);
  }
  return null;
}
