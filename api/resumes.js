import supabase from './db-client.js';
import { corsHeaders, requireUser, scopedClient } from './user-client.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await requireUser(supabase, req, res);
  if (!auth) return;

  if (auth.token && auth.token.startsWith('demo-token')) {
    if (req.method === 'GET') return res.status(200).json([]);
    if (req.method === 'POST' || req.method === 'PUT') {
      return res.status(200).json({ id: req.body?.id || `res_${Date.now()}`, ...(req.body || {}) });
    }
    if (req.method === 'DELETE') return res.status(200).json({ ok: true });
  }

  try {
    const client = scopedClient(auth.token);

    if (req.method === 'GET') {
      const { id } = req.query;
      let query = client
        .from('resumes')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('updated_at', { ascending: false });
      if (id) query = query.eq('id', id);
      const { data, error } = await query.limit(1);
      if (error) {
        console.warn('Could not read resumes from database:', error.message);
        return res.status(200).json([]);
      }
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const payload = {
        user_id: auth.user.id,
        analysis_id: body.analysisId || null,
        title: body.title || 'My improved resume',
        full_name: body.fullName || '',
        headline: body.headline || '',
        email: body.email || '',
        phone: body.phone || '',
        location: body.location || '',
        links: body.links || [],
        summary: body.summary || '',
        skills: body.skills || [],
        experience: body.experience || [],
        education: body.education || [],
        certifications: body.certifications || [],
      };

      try {
        if (req.method === 'PUT' && body.id) {
          const { data, error } = await client
            .from('resumes')
            .update(payload)
            .eq('id', body.id)
            .eq('user_id', auth.user.id)
            .select('*')
            .single();
          if (error) throw error;
          return res.status(200).json(data);
        }

        const { data, error } = await client.from('resumes').insert(payload).select('*').single();
        if (error) throw error;
        return res.status(201).json(data);
      } catch (dbErr) {
        console.warn('Database save resume warning:', dbErr.message);
        return res.status(200).json({ id: body.id || `res_${Date.now()}`, ...payload });
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing resume id.' });
      try {
        await client.from('resumes').delete().eq('id', id).eq('user_id', auth.user.id);
      } catch {}
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('resumes API error:', err);
    return res.status(200).json([]);
  }
}
