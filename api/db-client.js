import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co';

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const supabase = createClient(
  url,
  key,
  {
    global: {
      fetch: async (url, options) => {
        const res = await fetch(url, options);
        if (!res.ok && res.status >= 500) triggerRestore();
        return res;
      },
    },
  }
);

export default supabase;
