export interface AnalysisCheck {
  label: string;
  points: number;
  passed: boolean;
  detail: string;
  partial?: number;
}

export interface DimensionScore {
  key: string;
  label: string;
  weight: number;
  score: number;
  summary: string;
  checks: AnalysisCheck[];
}

export interface KeywordItem {
  term: string;
  count: number;
  source: 'role' | 'job' | 'both';
  importance: 'high' | 'medium' | 'low';
}

export interface QualityGrammar {
  type: string;
  issue: string;
  suggestion: string;
  excerpt: string;
}

export interface WeakVerb {
  phrase: string;
  count: number;
  alternatives: string[];
  fix: string;
  examples: string[];
}

export interface FormattingIssue {
  issue: string;
  fix: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  id: string;
  section: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  before?: string;
  after?: string;
  note?: string;
  tags?: string[];
}

export interface SkillRef {
  name: string;
  category: string;
}

export interface AnalysisResult {
  meta: {
    engine: string;
    fileName: string | null;
    targetRole: string;
    roleLabel: string;
    hasJD: boolean;
    analyzedAt: string;
    deterministic: boolean;
  };
  overallScore: number;
  rating: string;
  ratingDetail: string;
  dimensions: DimensionScore[];
  keywords: {
    matched: KeywordItem[];
    missing: KeywordItem[];
    recommended: KeywordItem[];
    frequency: { term: string; count: number }[];
    coverage: number;
  };
  jobMatch: {
    hasJD: boolean;
    compatibility: number | null;
    requiredSkillsFound: SkillRef[];
    missingTechnical: SkillRef[];
    missingSoft: string[];
    requiredYears: number | null;
    resumeYears: number;
    experienceVerdict: string;
    matchedJdKeywords: string[];
    missingJdKeywords: string[];
    titleMatch?: boolean;
    detectedTitle?: string | null;
  };
  quality: {
    grammar: QualityGrammar[];
    weakVerbs: WeakVerb[];
    quantified: {
      bulletsWithMetrics: number;
      totalBullets: number;
      ratio: number;
      status: string;
      examples: string[];
    };
    sectionCompleteness: { section: string; present: boolean; note: string }[];
    formattingIssues: FormattingIssue[];
  };
  recommendations: Recommendation[];
  stats: {
    wordCount: number;
    bulletCount: number;
    lineCount: number;
    estimatedPages: number;
    readingTimeSec: number;
    charCount: number;
    sections: string[];
    resumeYears: number;
    matchedSkills: string[];
  };
}

export interface AnalysisSummary {
  id: string;
  title: string;
  file_name: string | null;
  file_type: string | null;
  target_role: string;
  role_label: string | null;
  overall_score: number;
  rating: string;
  word_count: number | null;
  has_jd: boolean;
  created_at: string;
}

export interface AnalysisRecord extends AnalysisSummary {
  user_id: string;
  resume_text: string;
  job_description: string | null;
  result: AnalysisResult;
}

export interface ResumeSkill {
  id: string;
  name: string;
  category: string;
}

export interface ResumeExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface ResumeEducation {
  id: string;
  degree: string;
  institution: string;
  field: string;
  year: string;
  detail: string;
}

export interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumeDraft {
  id?: string;
  analysis_id: string | null;
  title: string;
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: ResumeLink[];
  summary: string;
  skills: ResumeSkill[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: string[];
  updated_at?: string;
}

export interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  target_role: string;
  career_level: string;
}
