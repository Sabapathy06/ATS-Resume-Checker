import supabase from './db-client.js';
import { corsHeaders, requireUser, scopedClient } from './user-client.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await requireUser(supabase, req, res);
  if (!auth) return;
  const client = scopedClient(auth.token);

  try {
    if (req.method === 'GET') {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(
        data || {
          user_id: auth.user.id,
          full_name: auth.user.user_metadata?.full_name || auth.user.email?.split('@')[0] || '',
          email: auth.user.email || '',
          target_role: 'software_engineer',
          career_level: 'fresher',
        }
      );
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const b = req.body || {};
      const payload = {
        user_id: auth.user.id,
        full_name: (b.fullName || '').slice(0, 120),
        email: (b.email || auth.user.email || '').slice(0, 160),
        phone: (b.phone || '').slice(0, 40),
        location: (b.location || '').slice(0, 120),
        linkedin: (b.linkedin || '').slice(0, 200),
        target_role: b.targetRole || 'generic',
        career_level: b.careerLevel || 'fresher',
      };
      const { data, error } = await client
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
