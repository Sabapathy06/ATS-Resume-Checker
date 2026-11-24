import supabase from './supabase';
import type { AnalysisRecord, AnalysisResult, AnalysisSummary, Profile, ResumeDraft } from '../types';

const DEMO_SESSION_KEY = 'ats_demo_user_session';
const ANALYSES_CACHE_KEY = 'ats_analyses_cache';
const PROFILE_CACHE_KEY = 'ats_profile_cache';
const RESUMES_CACHE_KEY = 'ats_resumes_cache';

async function token(): Promise<string | null> {
  try {
    const local = localStorage.getItem(DEMO_SESSION_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.access_token) return parsed.access_token;
    }
  } catch {}

  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return 'demo-token-123';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = await token();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(init.headers || {}),
    },
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload as T;
}

function getCachedAnalyses(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(ANALYSES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedAnalysis(rec: AnalysisRecord) {
  try {
    const list = getCachedAnalyses();
    const updated = [rec, ...list.filter((x) => x.id !== rec.id)].slice(0, 50);
    localStorage.setItem(ANALYSES_CACHE_KEY, JSON.stringify(updated));
  } catch {}
}

export const api = {
  analyze: async (body: {
    resumeText: string;
    jobDescription?: string;
    targetRole: string;
    fileName?: string;
    fileType?: string;
  }) => {
    const res = await request<{ id: string; createdAt: string; result: AnalysisResult }>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const record: AnalysisRecord = {
      id: res.id,
      user_id: 'current-user',
      title: body.fileName || `${res.result.meta.roleLabel} resume`,
      file_name: body.fileName || null,
      file_type: body.fileType || null,
      target_role: res.result.meta.targetRole,
      role_label: res.result.meta.roleLabel,
      resume_text: body.resumeText,
      job_description: body.jobDescription || null,
      overall_score: res.result.overallScore,
      rating: res.result.rating,
      word_count: res.result.stats.wordCount,
      has_jd: !!body.jobDescription && body.jobDescription.trim().length > 60,
      result: res.result,
      created_at: res.createdAt,
    };

    saveCachedAnalysis(record);
    return res;
  },

  listAnalyses: async (): Promise<AnalysisSummary[]> => {
    const cached = getCachedAnalyses();
    try {
      const remote = await request<AnalysisSummary[]>('/api/analyses');
      const map = new Map<string, AnalysisSummary>();
      remote.forEach((item) => map.set(item.id, item));
      cached.forEach((c) => {
        if (!map.has(c.id)) {
          map.set(c.id, {
            id: c.id,
            title: c.title,
            file_name: c.file_name,
            file_type: c.file_type,
            target_role: c.target_role,
            role_label: c.role_label,
            overall_score: c.overall_score,
            rating: c.rating,
            word_count: c.word_count,
            has_jd: c.has_jd,
            created_at: c.created_at,
          });
        }
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch {
      return cached.map((c) => ({
        id: c.id,
        title: c.title,
        file_name: c.file_name,
        file_type: c.file_type,
        target_role: c.target_role,
        role_label: c.role_label,
        overall_score: c.overall_score,
        rating: c.rating,
        word_count: c.word_count,
        has_jd: c.has_jd,
        created_at: c.created_at,
      }));
    }
  },

  getAnalysis: async (id: string): Promise<AnalysisRecord> => {
    const cached = getCachedAnalyses().find((x) => x.id === id);
    if (cached) return cached;

    try {
      const record = await request<AnalysisRecord>(`/api/analyses?id=${encodeURIComponent(id)}`);
      if (record) saveCachedAnalysis(record);
      return record;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  },

  deleteAnalysis: async (id: string) => {
    try {
      const list = getCachedAnalyses().filter((x) => x.id !== id);
      localStorage.setItem(ANALYSES_CACHE_KEY, JSON.stringify(list));
    } catch {}

    try {
      return await request<{ ok: true }>(`/api/analyses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      return { ok: true as const };
    }
  },

  getProfile: async (): Promise<Profile> => {
    let currentEmail = '';
    let currentName = '';
    try {
      const raw = localStorage.getItem('ats_demo_user_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) {
          currentEmail = parsed.user.email || '';
          currentName = parsed.user.user_metadata?.full_name || parsed.user.email?.split('@')[0] || '';
        }
      }
    } catch {}

    const fallbackProfile: Profile = {
      user_id: 'current-user',
      full_name: currentName || 'Candidate',
      email: currentEmail || '',
      phone: '',
      location: '',
      linkedin: '',
      target_role: 'software_engineer',
      career_level: 'fresher',
    };

    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const parsed: Profile = JSON.parse(cached);
        // Ensure email matches currently signed-in user
        if (currentEmail && parsed.email !== currentEmail) {
          parsed.email = currentEmail;
          parsed.full_name = currentName || parsed.full_name;
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {}

    try {
      const p = await request<Profile>('/api/profile');
      if (p) {
        if (currentEmail && p.email !== currentEmail) {
          p.email = currentEmail;
          p.full_name = currentName || p.full_name;
        }
        try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p)); } catch {}
        return p;
      }
      return fallbackProfile;
    } catch {
      return fallbackProfile;
    }
  },

  saveProfile: async (p: Partial<Profile>): Promise<Profile> => {
    try {
      const prev = await api.getProfile();
      const updated = { ...prev, ...p };
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated));
    } catch {}

    try {
      return await request<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(p) });
    } catch {
      return (await api.getProfile());
    }
  },

  getResume: async (analysisId?: string): Promise<ResumeDraft[]> => {
    try {
      const cached = localStorage.getItem(RESUMES_CACHE_KEY);
      if (cached) {
        const list: ResumeDraft[] = JSON.parse(cached);
        if (analysisId) return list.filter((r) => r.analysis_id === analysisId);
        return list;
      }
    } catch {}

    try {
      return await request<ResumeDraft[]>(`/api/resumes${analysisId ? `?id=${encodeURIComponent(analysisId)}` : ''}`);
    } catch {
      return [];
    }
  },

  saveResume: async (draft: ResumeDraft): Promise<ResumeDraft> => {
    try {
      const cached = localStorage.getItem(RESUMES_CACHE_KEY);
      const list: ResumeDraft[] = cached ? JSON.parse(cached) : [];
      const updated = [draft, ...list.filter((r) => r.id !== draft.id)];
      localStorage.setItem(RESUMES_CACHE_KEY, JSON.stringify(updated));
    } catch {}

    try {
      return await request<ResumeDraft>('/api/resumes', {
        method: draft.id ? 'PUT' : 'POST',
        body: JSON.stringify(draft),
      });
    } catch {
      return draft;
    }
  },
};

export default api;
