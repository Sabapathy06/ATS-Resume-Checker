import supabase from './supabase';

async function token(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
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

export const api = {
  analyze: (body: {
    resumeText: string;
    jobDescription?: string;
    targetRole: string;
    fileName?: string;
    fileType?: string;
  }) =>
    request<{ id: string; createdAt: string; result: import('../types').AnalysisResult }>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listAnalyses: () => request<import('../types').AnalysisSummary[]>('/api/analyses'),

  getAnalysis: (id: string) =>
    request<import('../types').AnalysisRecord>(`/api/analyses?id=${encodeURIComponent(id)}`),

  deleteAnalysis: (id: string) =>
    request<{ ok: true }>(`/api/analyses?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getProfile: () => request<import('../types').Profile>('/api/profile'),

  saveProfile: (p: Partial<import('../types').Profile>) =>
    request<import('../types').Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(p) }),

  getResume: (analysisId?: string) =>
    request<import('../types').ResumeDraft[]>(`/api/resumes${analysisId ? `?id=${encodeURIComponent(analysisId)}` : ''}`),

  saveResume: (draft: import('../types').ResumeDraft) =>
    request<import('../types').ResumeDraft>('/api/resumes', {
      method: draft.id ? 'PUT' : 'POST',
      body: JSON.stringify(draft),
    }),
};

export default api;
