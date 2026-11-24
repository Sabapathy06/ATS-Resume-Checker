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
      const { id, limit = '100' } = req.query;
      if (id) {
        const { data, error } = await client.from('analyses').select('*').eq('id', id).eq('user_id', auth.user.id).single();
        if (error) return res.status(404).json({ error: 'Report not found.' });
        return res.status(200).json(data);
      }
      const { data, error } = await client
        .from('analyses')
        .select(
          'id, title, file_name, file_type, target_role, role_label, overall_score, rating, word_count, has_jd, created_at'
        )
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(Math.min(parseInt(limit, 10) || 100, 200));
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing report id.' });
      const { error } = await client.from('analyses').delete().eq('id', id).eq('user_id', auth.user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('analyses API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
