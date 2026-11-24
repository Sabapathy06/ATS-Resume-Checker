export const ROLE_OPTIONS = [
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'frontend_developer', label: 'Frontend Developer' },
  { value: 'backend_developer', label: 'Backend Developer' },
  { value: 'fullstack_developer', label: 'Full Stack Developer' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'data_scientist', label: 'Data Scientist' },
  { value: 'ml_engineer', label: 'Machine Learning Engineer' },
  { value: 'devops_engineer', label: 'DevOps / Cloud Engineer' },
  { value: 'qa_engineer', label: 'QA / Test Engineer' },
  { value: 'mobile_developer', label: 'Mobile Developer' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'business_analyst', label: 'Business Analyst' },
  { value: 'ui_ux_designer', label: 'UI/UX Designer' },
  { value: 'digital_marketing', label: 'Digital Marketing Specialist' },
  { value: 'hr_recruiter', label: 'HR / Talent Acquisition' },
  { value: 'finance_analyst', label: 'Finance Analyst' },
  { value: 'cyber_security', label: 'Cybersecurity Analyst' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'generic', label: 'Other / General' },
];

export const CAREER_LEVELS = [
  { value: 'fresher', label: 'Student / Fresher' },
  { value: 'entry', label: 'Entry level (0–2 yrs)' },
  { value: 'mid', label: 'Mid level (3–7 yrs)' },
  { value: 'senior', label: 'Senior (8+ yrs)' },
  { value: 'switch', label: 'Career switcher' },
];

export function roleLabel(value: string): string {
  return ROLE_OPTIONS.find((r) => r.value === value)?.label ?? 'General Professional';
}
