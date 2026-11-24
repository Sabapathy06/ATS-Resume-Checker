import supabase from './db-client.js';
import { corsHeaders, requireUser, scopedClient } from './user-client.js';
import { analyzeResume } from './analysisEngine.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await requireUser(supabase, req, res);
  if (!auth) return;

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { resumeText, jobDescription = '', targetRole = 'generic', fileName = '', fileType = '' } = req.body || {};

    if (typeof resumeText !== 'string' || resumeText.trim().length < 40) {
      return res.status(400).json({
        error: 'We could not read enough text from this resume. If it is a scanned image PDF, please paste the text manually.',
      });
    }
    if (resumeText.length > 60000) {
      return res.status(400).json({ error: 'Resume text is unusually large (over 60,000 characters). Please upload a standard 1–2 page resume.' });
    }
    if (jobDescription && jobDescription.length > 30000) {
      return res.status(400).json({ error: 'Job description is too long (over 30,000 characters).' });
    }

    let result;
    try {
      result = analyzeResume({ resumeText, jobDescription, targetRole, fileName });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const title = fileName || `${result.meta.roleLabel} resume`;
    const client = scopedClient(auth.token);

    const { data, error } = await client
      .from('analyses')
      .insert({
        user_id: auth.user.id,
        title,
        file_name: fileName || null,
        file_type: fileType || null,
        target_role: result.meta.targetRole,
        role_label: result.meta.roleLabel,
        resume_text: resumeText,
        job_description: jobDescription || null,
        overall_score: result.overallScore,
        rating: result.rating,
        word_count: result.stats.wordCount,
        has_jd: !!jobDescription && jobDescription.trim().length > 60,
        result,
      })
      .select('id, created_at, title, overall_score, rating, target_role, role_label')
      .single();

    if (error) throw error;

    return res.status(201).json({ id: data.id, createdAt: data.created_at, result });
  } catch (err) {
    console.error('analyze API error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
}
