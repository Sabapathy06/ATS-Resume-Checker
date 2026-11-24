import { createClient } from '@supabase/supabase-js';

const url =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  'https://placeholder.supabase.co';

const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
