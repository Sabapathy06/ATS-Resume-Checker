/**
 * ATS Resume Analyzer — Deterministic Rule-Based Analysis Engine
 * -----------------------------------------------------------------
 * Every score in this engine is computed from the actual resume text and
 * (optionally) the job description supplied by the user. No random values,
 * no mock data, no AI guesswork — fully transparent, auditable rules.
 *
 * Pipeline:  normalize -> parse sections -> extract signals ->
 *            score 7 dimensions -> keyword match -> JD match ->
 *            quality checks -> recommendations
 */

export const ENGINE_VERSION = 'rule-engine-v1.2';
const CURRENT_YEAR = new Date().getFullYear();

/* ============================== DICTIONARIES ============================== */

const STOPWORDS = new Set(
  ('a an the and or but if then else when at by for with about against between into through during before after above below to from up down in out on off over under again further once here there all any both each few more most other some such no nor not only own same so than too very can will just should now is are was were be been being have has had having do does did doing would could ought i you he she it we they them his her its our their me him us my your mine yours this that these those am what which who whom as of also across per via etc eg ie using use used new role team teams work working year years experience skill skills ability strong good great excellent various including include includes well like upon within without among along while who\'s their\'s whose employer employers candidate candidates job jobs company companies opportunity opportunities looking join us our we you your you\'ll will\'ll plus ability').split(
    ' '
  )
);

const MISSPELLINGS = {
  recieve: 'receive', recieved: 'received', seperate: 'separate', acheive: 'achieve',
  acheived: 'achieved', managment: 'management', developement: 'development',
  enviroment: 'environment', experiance: 'experience', buisness: 'business',
  profesional: 'professional', comunication: 'communication', sucesful: 'successful',
  succesful: 'successful', responsibilty: 'responsibility', accomodate: 'accommodate',
  occured: 'occurred', adress: 'address', beleive: 'believe', calender: 'calendar',
  collegue: 'colleague', commited: 'committed', definately: 'definitely',
  embarass: 'embarrass', existance: 'existence', finaly: 'finally',
  foriegn: 'foreign', grammer: 'grammar', independant: 'independent',
  knowlege: 'knowledge', maintanance: 'maintenance', neccessary: 'necessary',
  noticable: 'noticeable', persistant: 'persistent', prefered: 'preferred',
  publically: 'publicly', recomend: 'recommend', refered: 'referred',
  relevent: 'relevant', schedual: 'schedule', untill: 'until', writting: 'writing',
  acheivement: 'achievement', achievment: 'achievement', techincal: 'technical',
  implimented: 'implemented', delievered: 'delivered', oppurtunity: 'opportunity',
  responsibilites: 'responsibilities', orgainzed: 'organized', sucessfully: 'successfully',
};

const WEAK_PHRASES = [
  { phrase: 'responsible for', alternatives: ['Owned', 'Led', 'Drove'], fix: 'State ownership of the outcome, not the duty.' },
  { phrase: 'was responsible for', alternatives: ['Owned', 'Directed'], fix: 'Passive duty language scores low with recruiters.' },
  { phrase: 'worked on', alternatives: ['Built', 'Engineered', 'Delivered'], fix: 'Say what you produced, not what you touched.' },
  { phrase: 'helped with', alternatives: ['Supported', 'Accelerated'], fix: 'Be specific about your contribution.' },
  { phrase: 'helped to', alternatives: ['Drove', 'Enabled'], fix: 'Quantify the assistance you provided.' },
  { phrase: 'assisted in', alternatives: ['Partnered on', 'Co-delivered'], fix: 'Show the result you co-owned.' },
  { phrase: 'assisted with', alternatives: ['Supported', 'Streamlined'], fix: 'Show the result you co-owned.' },
  { phrase: 'involved in', alternatives: ['Contributed to', 'Shipped'], fix: 'Name your concrete deliverable.' },
  { phrase: 'participated in', alternatives: ['Contributed to', 'Drove'], fix: 'Participation is not an achievement.' },
  { phrase: 'duties included', alternatives: ['Delivered', 'Executed'], fix: 'Task lists are invisible to ATS keyword parsers.' },
  { phrase: 'tasked with', alternatives: ['Charged with', 'Owned'], fix: 'Passive framing weakens impact.' },
  { phrase: 'in charge of', alternatives: ['Led', 'Directed'], fix: 'Use a strong leadership verb.' },
  { phrase: 'part of a team', alternatives: ['Collaborated with', 'Co-led'], fix: 'Describe your individual contribution.' },
  { phrase: 'familiar with', alternatives: ['Applied', 'Used'], fix: 'Hedging verbs undersell real experience.' },
  { phrase: 'exposure to', alternatives: ['Implemented', 'Operated'], fix: 'Exposure is not experience.' },
];

const STRONG_VERBS = new Set(
  ('led built developed designed implemented launched optimized automated reduced increased delivered architected migrated scaled mentored drove created improved managed analyzed engineered shipped streamlined negotiated established spearheaded orchestrated validated monitored forecasted accelerated boosted rescued resolved captured secured grew saved consolidated refactored unified integrated deployed automated researched prototyped modeled forecasted coached trained authored published presented diagnosed troubleshot standardized converted reengineered restructured revitalized transformed championed pioneered').split(
    ' '
  )
);

const BUZZWORDS = [
  'hardworking', 'hard working', 'hard-working', 'go-getter', 'go getter', 'team player',
  'detail oriented', 'detail-oriented', 'self-starter', 'self starter', 'think outside the box',
  'results-driven', 'results driven', 'synergy', 'dynamic professional', 'fast learner',
  'passionate about', 'ninja', 'rockstar', 'guru', 'wear many hats', 'thinking outside the box',
  'best of both worlds', 'hit the ground running',
];

const SOFT_SKILLS = [
  'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
  'adaptability', 'time management', 'collaboration', 'presentation skills', 'negotiation',
  'mentoring', 'ownership', 'stakeholder management', 'attention to detail', 'creativity',
  'conflict resolution', 'decision making', 'public speaking', 'client management',
  'interpersonal skills', 'team building', 'strategic thinking', 'initiative', 'empathy',
  'coaching', 'delegation', 'storytelling', 'documentation', 'cross-functional collaboration',
];

/* Skill taxonomy: canonical name -> category. Used for JD / resume skill mining. */
const SKILL_TAXONOMY = {
  // languages
  javascript: 'language', typescript: 'language', python: 'language', java: 'language',
  'c++': 'language', 'c#': 'language', go: 'language', rust: 'language', php: 'language',
  ruby: 'language', swift: 'language', kotlin: 'language', scala: 'language', r: 'language',
  matlab: 'language', sql: 'language', nosql: 'database', html: 'language', css: 'language',
  html5: 'language', css3: 'language', bash: 'language', shell: 'language', dart: 'language',
  solidity: 'language', groovy: 'language',
  // frontend / frameworks
  react: 'framework', 'react.js': 'framework', reactjs: 'framework', angular: 'framework',
  vue: 'framework', 'vue.js': 'framework', 'next.js': 'framework', nextjs: 'framework',
  redux: 'framework', 'tailwind css': 'framework', tailwind: 'framework', sass: 'framework',
  less: 'framework', webpack: 'tool', vite: 'tool', bootstrap: 'framework', jquery: 'framework',
  graphql: 'framework', 'rest api': 'framework', 'rest apis': 'framework', grpc: 'framework',
  jest: 'tool', mocha: 'tool', chai: 'tool', cypress: 'tool', playwright: 'tool',
  selenium: 'tool', storybook: 'tool', 'react native': 'framework', flutter: 'framework',
  'angular.js': 'framework', svelte: 'framework', 'unit testing': 'methodology',
  'test-driven development': 'methodology', tdd: 'methodology',
  // backend
  'node.js': 'framework', nodejs: 'framework', express: 'framework', 'express.js': 'framework',
  django: 'framework', flask: 'framework', fastapi: 'framework', 'spring boot': 'framework',
  spring: 'framework', '.net': 'framework', 'asp.net': 'framework', laravel: 'framework',
  'ruby on rails': 'framework', rails: 'framework', nestjs: 'framework', microservices: 'architecture',
  'serverless': 'architecture', 'event-driven': 'architecture', 'system design': 'methodology',
  'object-oriented programming': 'methodology', oops: 'methodology', 'data structures': 'methodology',
  algorithms: 'methodology', 'design patterns': 'methodology',
  // cloud & devops
  aws: 'cloud', azure: 'cloud', gcp: 'cloud', 'google cloud': 'cloud', docker: 'devops',
  kubernetes: 'devops', terraform: 'devops', ansible: 'devops', jenkins: 'devops',
  'github actions': 'devops', 'gitlab ci': 'devops', 'ci/cd': 'devops', cicd: 'devops',
  prometheus: 'devops', grafana: 'devops', linux: 'devops', nginx: 'devops',
  lambda: 'cloud', 'cloudformation': 'devops', helm: 'devops', 'aws lambda': 'cloud',
  'amazon web services': 'cloud', 'microsoft azure': 'cloud', 'elk stack': 'devops',
  datadog: 'devops', 'site reliability': 'methodology', sre: 'methodology',
  // data / ml
  pandas: 'data', numpy: 'data', 'scikit-learn': 'data', sklearn: 'data', tensorflow: 'data',
  pytorch: 'data', keras: 'data', xgboost: 'data', spark: 'data', pyspark: 'data',
  hadoop: 'data', hive: 'data', airflow: 'data', dbt: 'data', snowflake: 'data',
  'power bi': 'analytics', powerbi: 'analytics', tableau: 'analytics', looker: 'analytics',
  excel: 'analytics', 'advanced excel': 'analytics', 'google sheets': 'analytics',
  matplotlib: 'data', seaborn: 'data', plotly: 'data', 'machine learning': 'data',
  'deep learning': 'data', nlp: 'data', 'natural language processing': 'data',
  'computer vision': 'data', statistics: 'data', 'a/b testing': 'analytics',
  'ab testing': 'analytics', 'data visualization': 'analytics', 'data modeling': 'data',
  'data warehousing': 'data', etl: 'data', elt: 'data', 'feature engineering': 'data',
  'power query': 'analytics', 'sql server': 'database', 'big data': 'data',
  'llm': 'data', 'generative ai': 'data', mlops: 'data',
  // databases
  mysql: 'database', postgresql: 'database', postgres: 'database', mongodb: 'database',
  redis: 'database', oracle: 'database', dynamodb: 'database', elasticsearch: 'database',
  sqlite: 'database', cassandra: 'database', firebase: 'cloud', supabase: 'cloud',
  'ms sql': 'database',
  // tools / platforms
  git: 'tool', github: 'tool', gitlab: 'tool', bitbucket: 'tool', jira: 'tool',
  confluence: 'tool', trello: 'tool', asana: 'tool', notion: 'tool', figma: 'tool',
  'adobe xd': 'tool', sketch: 'tool', photoshop: 'tool', illustrator: 'tool',
  canva: 'tool', salesforce: 'tool', hubspot: 'tool', 'google analytics': 'analytics',
  'ga4': 'analytics', seo: 'analytics', sem: 'analytics', 'google ads': 'analytics',
  'meta ads': 'analytics', mailchimp: 'tool', zendesk: 'tool', slack: 'tool',
  'microsoft office': 'tool', 'ms office': 'tool', powerpoint: 'tool', word: 'tool',
  'google workspace': 'tool', zapier: 'tool', postman: 'tool', swagger: 'tool',
  'visual studio code': 'tool', eclipse: 'tool', intellij: 'tool',
  // design
  'user research': 'design', 'usability testing': 'design', wireframing: 'design',
  prototyping: 'design', 'design systems': 'design', accessibility: 'design',
  'information architecture': 'design', 'interaction design': 'design', 'user flows': 'design',
  'a/b design': 'design', 'visual design': 'design', 'design thinking': 'design',
  wcag: 'design', 'adobe creative suite': 'tool', 'motion graphics': 'design',
  // methodologies / business
  agile: 'methodology', scrum: 'methodology', kanban: 'methodology', 'waterfall': 'methodology',
  'product roadmap': 'methodology', 'stakeholder management': 'methodology',
  'okrs': 'methodology', 'kpis': 'methodology', 'roadmap planning': 'methodology',
  'go-to-market': 'methodology', 'market research': 'analytics', 'competitive analysis': 'analytics',
  'financial modeling': 'analytics', 'forecasting': 'analytics', 'budgeting': 'analytics',
  'variance analysis': 'analytics', 'financial reporting': 'analytics', 'gaap': 'methodology',
  'risk assessment': 'methodology', 'process improvement': 'methodology',
  'lean six sigma': 'methodology', 'root cause analysis': 'methodology',
  'test cases': 'methodology', 'regression testing': 'methodology', 'api testing': 'methodology',
  'performance testing': 'methodology', 'automation testing': 'methodology',
  'content strategy': 'methodology', 'copywriting': 'methodology', 'email marketing': 'analytics',
  'social media marketing': 'analytics', 'crm': 'tool', 'recruiting': 'methodology',
  'onboarding': 'methodology', 'employee engagement': 'methodology',
  'technical writing': 'methodology',
};

/* Role library: expected keywords + hard skills per target role. */
const ROLES = {
  software_engineer: {
    label: 'Software Engineer',
    keywords: ['software engineer', 'data structures', 'algorithms', 'system design', 'api', 'rest api', 'code review', 'unit testing', 'unit tests', 'agile', 'scrum', 'debugging', 'ci/cd', 'object-oriented', 'microservices', 'version control', 'git', 'problem solving', 'distributed systems', 'scalable', 'performance optimization', 'technical documentation', 'sprint', 'requirement analysis'],
    hardSkills: ['python', 'java', 'javascript', 'typescript', 'c++', 'go', 'sql', 'git', 'docker', 'kubernetes', 'aws', 'rest api', 'graphql', 'linux', 'jenkins', 'ci/cd', 'unit testing', 'react', 'node.js', 'spring boot', 'microservices', 'redis', 'kafka', 'mongodb', 'postgresql', 'terraform', 'system design'],
  },
  frontend_developer: {
    label: 'Frontend Developer',
    keywords: ['frontend', 'ui', 'responsive design', 'component', 'components', 'accessibility', 'performance optimization', 'cross-browser', 'javascript', 'css', 'html', 'state management', 'design system', 'redux', 'spa', 'web performance', 'lighthouse', 'seo', 'api integration', 'user interface', 'component library', 'figma to code'],
    hardSkills: ['javascript', 'typescript', 'react', 'angular', 'vue', 'next.js', 'redux', 'html', 'css', 'tailwind', 'sass', 'webpack', 'vite', 'jest', 'cypress', 'playwright', 'graphql', 'rest api', 'figma', 'accessibility', 'storybook', 'git'],
  },
  backend_developer: {
    label: 'Backend Developer',
    keywords: ['backend', 'api', 'rest api', 'microservices', 'database', 'sql', 'authentication', 'authorization', 'caching', 'scalability', 'latency', 'throughput', 'queue', 'message broker', 'deployment', 'docker', 'kubernetes', 'system design', 'indexing', 'orm', 'third-party integration', 'webhooks'],
    hardSkills: ['node.js', 'python', 'java', 'go', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'kafka', 'rabbitmq', 'grpc', 'graphql', 'rest api', 'microservices', 'ci/cd', 'linux', 'terraform', 'django', 'spring boot', 'express'],
  },
  fullstack_developer: {
    label: 'Full Stack Developer',
    keywords: ['full stack', 'frontend', 'backend', 'api', 'rest api', 'database', 'deployment', 'ci/cd', 'agile', 'scrum', 'code review', 'unit testing', 'responsive design', 'authentication', 'state management', 'cloud', 'microservices', 'version control', 'end-to-end', 'performance optimization'],
    hardSkills: ['javascript', 'typescript', 'react', 'node.js', 'express', 'next.js', 'python', 'sql', 'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'git', 'jest', 'ci/cd', 'graphql', 'rest api', 'tailwind', 'linux'],
  },
  data_analyst: {
    label: 'Data Analyst',
    keywords: ['data analysis', 'sql', 'dashboard', 'dashboards', 'data visualization', 'reporting', 'kpi', 'kpis', 'etl', 'data cleaning', 'excel', 'stakeholder', 'insights', 'trend analysis', 'data validation', 'power bi', 'tableau', 'storytelling', 'business intelligence', 'metrics', 'a/b testing', 'data pipeline'],
    hardSkills: ['sql', 'excel', 'python', 'r', 'power bi', 'tableau', 'looker', 'pandas', 'numpy', 'statistics', 'a/b testing', 'data visualization', 'etl', 'dbt', 'snowflake', 'matplotlib', 'google analytics', 'data modeling', 'sql server', 'airflow'],
  },
  data_scientist: {
    label: 'Data Scientist',
    keywords: ['machine learning', 'statistical modeling', 'predictive modeling', 'feature engineering', 'python', 'data preprocessing', 'model evaluation', 'a/b testing', 'regression', 'classification', 'clustering', 'nlp', 'experimentation', 'data pipeline', 'hypothesis testing', 'storytelling', 'algorithms', 'deep learning'],
    hardSkills: ['python', 'r', 'sql', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'statistics', 'machine learning', 'deep learning', 'nlp', 'spark', 'airflow', 'tableau', 'matplotlib', 'a/b testing', 'feature engineering', 'snowflake', 'aws'],
  },
  ml_engineer: {
    label: 'Machine Learning Engineer',
    keywords: ['machine learning', 'deep learning', 'model deployment', 'mlops', 'pipeline', 'feature store', 'model monitoring', 'docker', 'kubernetes', 'latency', 'inference', 'training', 'data pipeline', 'gpu', 'distributed training', 'model versioning', 'experiment tracking', 'nlp', 'computer vision'],
    hardSkills: ['python', 'pytorch', 'tensorflow', 'scikit-learn', 'docker', 'kubernetes', 'aws', 'gcp', 'mlops', 'spark', 'kafka', 'airflow', 'mlflow', 'nlp', 'computer vision', 'sql', 'redis', 'terraform', 'feature engineering'],
  },
  devops_engineer: {
    label: 'DevOps / Cloud Engineer',
    keywords: ['ci/cd', 'infrastructure as code', 'automation', 'monitoring', 'observability', 'docker', 'kubernetes', 'terraform', 'deployment', 'cloud', 'aws', 'azure', 'reliability', 'incident response', 'cost optimization', 'security', 'scaling', 'logging', 'containers', 'orchestration', 'site reliability'],
    hardSkills: ['docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd', 'aws', 'azure', 'gcp', 'linux', 'nginx', 'prometheus', 'grafana', 'bash', 'python', 'helm', 'datadog', 'lambda', 'sre'],
  },
  qa_engineer: {
    label: 'QA / Test Engineer',
    keywords: ['test cases', 'test plan', 'regression testing', 'automation testing', 'api testing', 'performance testing', 'defect', 'bug tracking', 'sdLC', 'agile', 'test coverage', 'manual testing', 'testng', 'selenium', 'quality assurance', 'test documentation', 'integration testing'],
    hardSkills: ['selenium', 'playwright', 'cypress', 'appium', 'postman', 'rest assured', 'java', 'python', 'javascript', 'sql', 'jira', 'regression testing', 'api testing', 'performance testing', 'automation testing', 'testng', 'cucumber', 'git', 'jenkins'],
  },
  mobile_developer: {
    label: 'Mobile Developer',
    keywords: ['mobile app', 'ios', 'android', 'react native', 'flutter', 'app store', 'play store', 'ui', 'push notifications', 'rest api', 'offline first', 'app performance', 'crashlytics', 'mobile architecture', 'release management'],
    hardSkills: ['swift', 'kotlin', 'java', 'dart', 'react native', 'flutter', 'javascript', 'typescript', 'rest api', 'graphql', 'firebase', 'sqlite', 'git', 'ci/cd', 'xcode', 'android studio', 'unit testing'],
  },
  product_manager: {
    label: 'Product Manager',
    keywords: ['product roadmap', 'product strategy', 'stakeholder management', 'user research', 'okrs', 'kpis', 'backlog', 'prioritization', 'go-to-market', 'agile', 'scrum', 'user stories', 'a/b testing', 'metrics', 'competitive analysis', 'cross-functional', 'discovery', 'product launch', 'customer feedback'],
    hardSkills: ['roadmap planning', 'user research', 'a/b testing', 'sql', 'google analytics', 'figma', 'jira', 'confluence', 'product strategy', 'market research', 'excel', 'okrs', 'kpis', 'competitive analysis', 'go-to-market', 'stakeholder management'],
  },
  business_analyst: {
    label: 'Business Analyst',
    keywords: ['requirement gathering', 'business requirements', 'process improvement', 'stakeholder', 'documentation', 'gap analysis', 'data analysis', 'workflow', 'user stories', 'use cases', 'sql', 'reporting', 'dashboards', 'brd', 'frd', ' sdlc', 'root cause analysis'],
    hardSkills: ['sql', 'excel', 'power bi', 'tableau', 'jira', 'confluence', 'visio', 'data analysis', 'process improvement', 'requirement analysis', 'documentation', 'root cause analysis', 'financial modeling', 'python'],
  },
  ui_ux_designer: {
    label: 'UI/UX Designer',
    keywords: ['user research', 'wireframing', 'prototyping', 'usability testing', 'design system', 'accessibility', 'information architecture', 'user flows', 'figma', 'interaction design', 'visual design', 'personas', 'journey mapping', 'design thinking', 'mobile first', 'responsive'],
    hardSkills: ['figma', 'adobe xd', 'sketch', 'photoshop', 'illustrator', 'user research', 'usability testing', 'wireframing', 'prototyping', 'design systems', 'accessibility', 'information architecture', 'interaction design', 'design thinking', 'motion graphics'],
  },
  digital_marketing: {
    label: 'Digital Marketing Specialist',
    keywords: ['seo', 'sem', 'content strategy', 'campaign', 'google ads', 'social media', 'email marketing', 'conversion rate', 'roi', 'analytics', 'keyword research', 'link building', 'copywriting', 'funnel', 'a/b testing', 'brand awareness', 'lead generation', 'marketing automation'],
    hardSkills: ['seo', 'sem', 'google ads', 'google analytics', 'content strategy', 'copywriting', 'email marketing', 'social media marketing', 'a/b testing', 'hubspot', 'mailchimp', 'crm', 'keyword research', 'canva', 'excel', 'meta ads'],
  },
  hr_recruiter: {
    label: 'HR / Talent Acquisition',
    keywords: ['recruiting', 'sourcing', 'onboarding', 'employee engagement', 'talent acquisition', 'interview', 'stakeholder management', 'employer branding', 'ats', 'hr operations', 'performance management', 'culture', 'candidate experience', 'hris', 'exit interview'],
    hardSkills: ['recruiting', 'onboarding', 'sourcing', 'employee engagement', 'ats', 'hris', 'workday', 'greenhouse', 'lever', 'linkedin recruiter', 'excel', 'stakeholder management', 'documentation'],
  },
  finance_analyst: {
    label: 'Finance Analyst',
    keywords: ['financial modeling', 'forecasting', 'budgeting', 'variance analysis', 'financial reporting', 'gaap', 'excel', 'accounting', 'audit', 'reconciliation', 'cash flow', 'kpis', 'cost reduction', 'month-end close', 'stakeholder', 'compliance'],
    hardSkills: ['excel', 'financial modeling', 'forecasting', 'budgeting', 'variance analysis', 'financial reporting', 'gaap', 'sql', 'power bi', 'tableau', 'python', 'sap', 'oracle', 'reconciliation', 'accounting'],
  },
  cyber_security: {
    label: 'Cybersecurity Analyst',
    keywords: ['security', 'vulnerability', 'penetration testing', 'incident response', 'siem', 'threat detection', 'risk assessment', 'compliance', 'encryption', 'firewall', 'zero trust', 'security audit', 'ids', 'malware analysis', 'owasp'],
    hardSkills: ['siem', 'splunk', 'penetration testing', 'burp suite', 'nessus', 'wireshark', 'metasploit', 'python', 'linux', 'incident response', 'risk assessment', 'owasp', 'nmap', 'compliance', 'firewall', 'encryption', 'docker', 'aws'],
  },
  project_manager: {
    label: 'Project Manager',
    keywords: ['project management', 'agile', 'scrum', 'stakeholder management', 'risk management', 'budget', 'timeline', 'scope', 'resource planning', 'status reporting', 'okrs', 'kpis', 'cross-functional', 'delivery', 'change management', 'jira', 'sprint planning'],
    hardSkills: ['jira', 'confluence', 'ms project', 'agile', 'scrum', 'kanban', 'excel', 'power bi', 'risk assessment', 'stakeholder management', 'budgeting', 'roadmap planning', 'pmp', 'prince2'],
  },
  generic: {
    label: 'General Professional',
    keywords: ['communication', 'problem solving', 'teamwork', 'leadership', 'project management', 'analytical skills', 'stakeholder', 'reporting', 'documentation', 'process improvement', 'collaboration', 'time management', 'initiative', 'ownership', 'results'],
    hardSkills: ['excel', 'sql', 'python', 'project management', 'agile', 'jira', 'communication', 'reporting', 'documentation', 'data analysis'],
  },
};

const SECTION_DEFS = [
  { key: 'summary', label: 'Professional Summary', re: /^(professional\s+|career\s+|executive\s+)?(summary|profile|objective|about(\s+me)?|summary\s+of\s+qualifications|career\s+summary|personal\s+statement)\b/i, aliases: ['summary', 'objective', 'profile', 'about', 'qualifications', 'statement'] },
  { key: 'skills', label: 'Skills', re: /^(technical\s+|core\s+|key\s+|professional\s+|it\s+)?(skills|skill\s+set|competencies|technologies|tech\s+stack|expertise|tools\s*(&|and)?\s*(technologies|skills))\b/i, aliases: ['skills', 'competencies', 'technologies', 'expertise', 'stack', 'tools'] },
  { key: 'experience', label: 'Work Experience', re: /^(work|professional|employment|industry|relevant|internship|job)?\s*(experience|history|background)\b/i, aliases: ['experience', 'employment', 'history', 'background', 'internships'] },
  { key: 'education', label: 'Education', re: /^(education|academic(s)?|academic\s+(background|qualifications)|educational\s+qualifications|qualifications)\b/i, aliases: ['education', 'academic', 'academics'] },
  { key: 'projects', label: 'Projects', re: /^(personal\s+|academic\s+|key\s+|technical\s+|notable\s+|selected\s+)?(projects|project\s+work|portfolio)\b/i, aliases: ['projects', 'project', 'portfolio'] },
  { key: 'certifications', label: 'Certifications', re: /^(certifications?|licenses?|courses|training|professional\s+development|certificates)\b/i, aliases: ['certifications', 'certification', 'certificates', 'courses', 'training', 'licenses'] },
  { key: 'achievements', label: 'Achievements', re: /^(achievements?|awards?|honors?|accomplishments|recognition|extra[-\s]?curricular)\b/i, aliases: ['achievements', 'awards', 'honors', 'accomplishments', 'recognition'] },
  { key: 'publications', label: 'Publications', re: /^(publications?|papers?|research|patents?)\b/i, aliases: ['publications', 'papers', 'research', 'patents'] },
  { key: 'languages', label: 'Languages', re: /^(languages?|linguistic\s+skills)\b/i, aliases: ['languages', 'language'] },
  { key: 'interests', label: 'Interests', re: /^(interests?|hobbies|activities|volunteering|references)\b/i, aliases: ['interests', 'hobbies', 'activities', 'volunteering', 'references'] },
];

const CANONICAL_ORDER = ['contact', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'];

/* ============================== TEXT HELPERS ============================== */

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasTerm(haystack, term) {
  const t = term.toLowerCase().trim();
  if (!t) return false;
  const re = new RegExp(`(^|[^a-z0-9+#.])${esc(t)}([^a-z0-9+#.]|$)`, 'i');
  return re.test(haystack);
}

/* Skill matcher that also accepts a trailing version (html -> html5, css -> css3). */
function matchSkill(textLower, skill) {
  if (hasTerm(textLower, skill)) return true;
  const re = new RegExp(`(^|[^a-z0-9+#.])${esc(skill)}\\d+([^a-z0-9+#.]|$)`, 'i');
  return re.test(textLower);
}

const TYPOGRAPHIC_CHARS = /[—–−’‘“”…•·≈°€]/g;
function exoticCharCount(text) {
  const stripped = text.replace(TYPOGRAPHIC_CHARS, '');
  return (stripped.match(/[^\x20-\x7E\n]/g) || []).length;
}

function pipeCountOutsideHeader(text) {
  const lines = text.split('\n');
  const header = lines.slice(0, 3).join('\n');
  const body = lines.slice(3).join('\n');
  return (body.match(/\|/g) || []).length + Math.max(0, (header.match(/\|/g) || []).length - 3);
}

function countTerm(haystack, term) {
  const t = term.toLowerCase().trim();
  if (!t) return 0;
  const re = new RegExp(`(^|[^a-z0-9+#.])${esc(t)}([^a-z0-9+#.]|$)`, 'gi');
  const m = haystack.match(re);
  return m ? m.length : 0;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ============================== PARSING ============================== */

function splitLines(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\t/g, '   '))
    .filter((l) => l.trim().length > 0);
}

function matchHeading(line) {
  const trimmed = line.trim();
  const noDecor = trimmed.replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9]+$/, '').trim();
  if (!noDecor) return null;
  if (noDecor.length > 48) return null;
  if (/[.!?]$/.test(noDecor)) return null;
  if (noDecor.includes(':')) return null;
  const lower = noDecor.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length > 5) return null;
  for (const def of SECTION_DEFS) {
    if (words.length <= 4 && def.re.test(lower)) return def.key;
  }
  const isCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  if (isCaps && words.length <= 5) {
    for (const def of SECTION_DEFS) {
      if (words.some((w) => def.aliases.includes(w.replace(/[^a-z]/g, '')))) return def.key;
    }
  }
  return null;
}

export function parseSections(text) {
  const lines = splitLines(text);
  const sections = {};
  const order = [];
  let current = 'contact';
  const headingLines = [];
  lines.forEach((line, index) => {
    const key = matchHeading(line);
    if (key) {
      current = key;
      if (!sections[current]) {
        sections[current] = [];
        order.push(current);
      }
      headingLines.push({ line: line.trim(), section: key, index });
      return;
    }
    if (!sections[current]) {
      sections[current] = [];
      order.push(current);
    }
    sections[current].push(line.trim());
  });
  const joined = {};
  for (const k of Object.keys(sections)) joined[k] = sections[k].join('\n');
  return { sections, joined, order, lines, headingLines };
}

function extractBullets(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 25)
    .map((l) => l.replace(/^[•▪◦‣·∙*o\-–—>»]+\s*/, '').trim())
    .filter((l) => l.split(/\s+/).length >= 4);
}

const MONTH_RE = '(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?\\s*';

function extractYears(text) {
  const years = [];
  const monthYear = new RegExp(MONTH_RE + '(19|20)\\d{2}', 'gi');
  let m;
  while ((m = monthYear.exec(text))) years.push(parseInt(m[2] + m[3], 10));
  const bare = /(^|[^0-9])((19|20)\d{2})\s*(–|-|—|to)\s*((19|20)\d{2}|present|current|now)/gi;
  while ((m = bare.exec(text))) {
    years.push(parseInt(m[2], 10));
    const end = /present|current|now/i.test(m[5]) ? CURRENT_YEAR : parseInt(m[5], 10);
    years.push(end);
  }
  return years.filter((y) => y >= 1960 && y <= CURRENT_YEAR + 1).sort((a, b) => a - b);
}

function detectContact(text) {
  const email = (text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i) || [null])[0];
  const phone = (text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) || [null])[0];
  const linkedin = /linkedin\.com\/[a-z0-9/_-]+/i.test(text);
  const github = /github\.com\/[a-z0-9/_-]+/i.test(text);
  const portfolio = /\b(portfolio|website|blog|behance|dribbble|medium)\b\s*[:|]/i.test(text) || /(https?:\/\/(?!.*(linkedin|github)))[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const city = /\b(bengaluru|bangalore|mumbai|delhi|new delhi|noida|gurgaon|gurugram|hyderabad|chennai|pune|kolkata|ahmedabad|jaipur|indore|remote|new york|san francisco|london|singapore|dubai|toronto|berlin|sydney|melbourne|amsterdam)\b/i.test(text);
  return { email, phone, linkedin, github, portfolio, city };
}

/* ============================== SIGNAL EXTRACTION ============================== */

function mineSkills(text) {
  const found = [];
  for (const [skill, category] of Object.entries(SKILL_TAXONOMY)) {
    if (hasTerm(text, skill)) found.push({ name: skill, category });
  }
  return found;
}

function extractJdKeywords(jd, limit = 45) {
  const lower = ` ${jd.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ')} `;
  const freq = new Map();
  const tokens = lower.split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
  for (const t of meaningful) freq.set(t, (freq.get(t) || 0) + 1);
  for (let i = 0; i < meaningful.length - 1; i++) {
    const bi = `${meaningful[i]} ${meaningful[i + 1]}`;
    freq.set(bi, (freq.get(bi) || 0) + 1);
  }
  return [...freq.entries()]
    .filter(([term, c]) => c >= 2 && term.length > 4)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

function extractRequiredYears(jd) {
  if (!jd) return null;
  const m = jd.match(/(\d{1,2})\s*\+?\s*(?:-|to|–)\s*(\d{1,2})?\s*years?/i) || jd.match(/(\d{1,2})\s*\+?\s*years?/i);
  if (!m) return null;
  return parseInt(m[1], 10);
}

/* ============================== SCORING ============================== */

function buildDimension(key, label, weight, checks, summaryFn) {
  const total = checks.reduce((s, c) => s + c.points, 0) || 1;
  const earned = checks.reduce((s, c) => {
    if (c.points === 0) return s;
    const ratio = c.passed ? 1 : typeof c.partial === 'number' ? c.partial : 0;
    return s + c.points * clamp(ratio, 0, 1);
  }, 0);
  const score = Math.round((earned / total) * 100);
  return { key, label, weight, score, checks, summary: summaryFn(score, checks) };
}

function scoreFormatting(ctx) {
  const c = ctx.contact;
  const wc = ctx.stats.wordCount;
  const pipes = pipeCountOutsideHeader(ctx.text);
  const tabs = (ctx.text.match(/\t/g) || []).length;
  const special = exoticCharCount(ctx.text);
  const multiSpace = (ctx.text.match(/ {3,}/g) || []).length;
  const hasDates = ctx.years.length >= 2;
  const bullets = ctx.allBullets;
  const bulletMarkers = /(^|\n)\s*[•▪◦‣·∙*-]/.test(ctx.text);
  const idealLength = wc >= 350 && wc <= 1000;
  const pronouns = (ctx.text.toLowerCase().match(/(^|[^a-z])(i|my|me)\b/g) || []).length;

  const checks = [
    { label: 'Email address is present', points: 10, passed: !!c.email, detail: c.email ? `Found: ${c.email}` : 'ATS parsers create your candidate record from the email field. A missing email can silently drop your application.' },
    { label: 'Phone number is present', points: 9, passed: !!c.phone, detail: c.phone ? `Found: ${c.phone}` : 'Recruiters and ATS need a parseable phone number in the header block.' },
    { label: 'LinkedIn / professional profile link', points: 6, passed: c.linkedin, detail: c.linkedin ? 'LinkedIn URL detected — good for recruiter verification.' : 'Adding a LinkedIn URL increases recruiter contact rate and is parsed cleanly by modern ATS.' },
    { label: 'Resume length is in the 350–1000 word band', points: 10, passed: idealLength, detail: `Current length: ${wc} words. ${wc < 350 ? 'Too thin — expand achievements with measurable outcomes.' : wc > 1000 ? 'Too dense — trim to the most relevant 1–2 pages of content.' : 'Ideal single/two-page density for ATS parsing.'}` },
    { label: 'Employment dates are machine-readable', points: 12, passed: hasDates, detail: hasDates ? `${ctx.years.length} date anchors detected — ATS can reconstruct your timeline.` : 'No parseable month/year ranges found. Use formats like “Jan 2021 – Mar 2023” so ATS can compute tenure.' },
    { label: 'Bulleted achievement lists are used', points: 8, passed: bulletMarkers || bullets.length >= 5, detail: bullets.length >= 5 ? `${bullets.length} bullet statements parsed.` : 'Recruiters scan bullets, not paragraphs. Convert dense prose into 3–5 bullets per role.' },
    { label: 'No table / column delimiters (pipes or tabs)', points: 8, passed: pipes <= 2 && tabs === 0, detail: pipes > 2 || tabs > 0 ? `Found ${pipes} pipe character(s) and ${tabs} tab(s) — these usually indicate a table or column layout, which older ATS read in the wrong order.` : 'Content is laid out linearly — parses correctly in every ATS.' },
    { label: 'Exotic / non-standard characters are minimal', points: 5, passed: special <= 6, detail: special > 6 ? `${special} non-ASCII characters found — special glyphs and emoji can corrupt parsing in legacy ATS.` : 'Character set is ASCII-safe.' },
    { label: 'No excessive internal spacing', points: 4, passed: multiSpace <= 3, detail: multiSpace > 3 ? `${multiSpace} runs of 3+ spaces detected — often a symptom of column alignment or tabular layout.` : 'Spacing is clean.' },
    { label: 'Written in implicit first person (no “I/my/me”)', points: 8, passed: pronouns <= 2, detail: pronouns > 2 ? `${pronouns} first-person pronoun usages found — standard resume style uses implied first person (“Led” not “I led”).` : 'Professional implied-first-person tone.' },
    { label: 'Standard section headings detected', points: 10, passed: ctx.foundHeadings >= 3, detail: `${ctx.foundHeadings} standard heading(s) recognized: ${ctx.headingLabels.join(', ') || 'none'}. Unusual heading names break ATS section mapping.` },
    { label: 'Consistent bullet formatting', points: 10, passed: ctx.consistentBullets, detail: ctx.consistentBullets ? 'One bullet glyph style used throughout.' : 'Multiple bullet/marker styles detected — inconsistent markers can merge bullets into a single unparsable line.' },
  ];

  return buildDimension('formatting', 'ATS Formatting', 20, checks, (score) =>
    score >= 80
      ? 'Your file structure parses cleanly in applicant tracking systems.'
      : score >= 55
        ? 'Mostly parseable, but a few layout choices will cost you accuracy in strict ATS.'
        : 'Structural issues are actively hurting how machines read your resume.'
  );
}

function scoreKeywords(ctx) {
  const roleKw = ctx.role.keywords;
  const matchedRole = roleKw.filter((k) => hasTerm(ctx.text, k));
  const missingRole = roleKw.filter((k) => !matchedRole.includes(k));
  const jdTerms = ctx.jdKeywords.map((k) => k.term);
  const matchedJd = jdTerms.filter((k) => hasTerm(ctx.text, k));

  const roleCoverage = matchedRole.length / (roleKw.length || 1);
  const jdCoverage = ctx.hasJD ? matchedJd.length / (jdTerms.length || 1) : 0;
  const totalHits =
    roleKw.reduce((s, k) => s + countTerm(ctx.text, k), 0) +
    (ctx.hasJD ? jdTerms.reduce((s, k) => s + countTerm(ctx.text, k), 0) : 0);
  const density = ctx.stats.wordCount ? totalHits / ctx.stats.wordCount : 0;
  const densityScore = density >= 0.04 && density <= 0.14 ? 1 : density < 0.04 ? density / 0.04 : clamp(1 - (density - 0.14) / 0.1, 0, 1);

  const raw = ctx.hasJD
    ? roleCoverage * 45 + jdCoverage * 35 + densityScore * 20
    : roleCoverage * 65 + densityScore * 35;

  const checks = [
    { label: `Role keywords present (${matchedRole.length}/${roleKw.length})`, points: ctx.hasJD ? 45 : 65, passed: false, earnedRatio: roleCoverage, detail: `Expected vocabulary for a ${ctx.roleLabel} resume. Coverage: ${pct(matchedRole.length, roleKw.length)}%.` },
    { label: ctx.hasJD ? `Job description keywords mirrored (${matchedJd.length}/${jdTerms.length})` : 'Job description supplied', points: ctx.hasJD ? 35 : 0, passed: ctx.hasJD && jdCoverage >= 0.5, detail: ctx.hasJD ? `You mirror ${pct(matchedJd.length, jdTerms.length)}% of the language this posting uses.` : 'No job description provided — keyword score is measured against the role library only.', earnedRatio: ctx.hasJD ? jdCoverage : null },
    { label: 'Keyword density in the healthy band', points: ctx.hasJD ? 20 : 35, passed: densityScore >= 0.9, detail: `Density ${(density * 100).toFixed(1)}% (target 4–14% of total words). ${density < 0.04 ? 'Too low — repeat your core keywords naturally across summary, skills and experience.' : density > 0.14 ? 'Too high — reads as keyword stuffing; recruiters penalise it.' : 'Balanced.'}` },
  ];

  const total = checks.reduce((s, c) => s + c.points, 0) || 1;
  const earned = checks.reduce((s, c) => {
    if (c.points === 0) return s;
    if (typeof c.earnedRatio === 'number') return s + c.points * clamp(c.earnedRatio, 0, 1);
    return s + (c.passed ? c.points * 0.75 : 0);
  }, 0);
  const score = Math.round(clamp(0.5 * (raw + (earned / total) * 100), 0, 100));
  checks.forEach((c) => delete c.earnedRatio);

  return {
    key: 'keywords',
    label: 'Keyword Optimization',
    weight: 18,
    score,
    checks,
    summary:
      score >= 80
        ? 'Strong keyword coverage — you speak the language of this role.'
        : score >= 55
          ? 'Decent coverage, but several high-signal keywords are absent.'
          : 'Keyword gap is significant — ATS ranking will push you below better-matched candidates.',
    data: { matchedRole, missingRole, matchedJd, jdTerms, density: +(density * 100).toFixed(1) },
  };
}

function scoreSkills(ctx) {
  const required = [];
  const seen = new Set();
  for (const s of ctx.role.hardSkills) {
    if (!seen.has(s)) { required.push(s); seen.add(s); }
  }
  for (const s of ctx.jdSkills) {
    if (!seen.has(s.name)) { required.push(s.name); seen.add(s.name); }
  }
  const resumeSkills = mineSkills(ctx.text).map((s) => s.name);
  const resumeSkillSet = new Set(resumeSkills);
  const matched = required.filter((s) => resumeSkillSet.has(s) || matchSkill(ctx.textLower, s));
  const missing = required.filter((s) => !matched.includes(s));
  const score = pct(matched.length, required.length || 1);

  const checks = [
    { label: `Role-required skills present (${matched.length}/${required.length})`, points: 60, passed: score >= 70, detail: `Matched ${matched.length} of ${required.length} expected hard skills for ${ctx.roleLabel}.` },
    { label: 'Dedicated Skills section exists', points: 20, passed: !!ctx.joined.skills, detail: ctx.joined.skills ? 'A dedicated skills block gives ATS a clean, dense keyword field to index.' : 'No “Skills” heading detected — add a bulleted/comma-separated skills section.' },
    { label: 'Skills also appear inside experience bullets', points: 20, passed: (() => { const exp = ctx.joined.experience || ''; return ctx.role.hardSkills.filter((s) => hasTerm(exp, s)).length >= 3; })(), detail: 'Contextual skill usage (tools used inside a project bullet) is weighted more heavily than a flat skills list.' },
  ];

  return {
    key: 'skills',
    label: 'Skills Match',
    weight: 15,
    score: Math.round(score * 0.7 + buildCheckScore(checks) * 0.3),
    checks,
    summary:
      score >= 75 ? 'Your hard skills line up well with what this role demands.' : score >= 50 ? 'Half the expected toolkit is covered — the gaps below are the fastest wins.' : 'Critical skill gaps will likely trigger an automatic screen-out.',
    data: { matched, missing, resumeSkills },
  };
}

function buildCheckScore(checks) {
  const total = checks.reduce((s, c) => s + c.points, 0) || 1;
  const earned = checks.reduce((s, c) => s + (c.passed ? c.points : 0), 0);
  return Math.round((earned / total) * 100);
}

function scoreExperience(ctx) {
  const expText = ctx.joined.experience || '';
  const bullets = extractBullets(expText || ctx.text);
  const verbBullets = bullets.filter((b) => {
    const first = b.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    return STRONG_VERBS.has(first);
  });
  const quantified = bullets.filter((b) => /\d+\s*(%|percent|k\b|m\b|x\b|\+|users|customers|hours|days|weeks|months|hours)|\$\s?\d|(\d+[.,]\d+)/i.test(b));
  const weakHits = WEAK_PHRASES.filter((w) => new RegExp(esc(w.phrase), 'i').test(expText || ctx.text));
  const chronological = ctx.years.length >= 2;
  const reverse = (() => {
    const idx = ctx.headingLines.filter((h) => h.section === 'experience');
    if (!idx.length) return false;
    const expStart = idx[0].index;
    const after = ctx.lines.slice(expStart).join('\n');
    const ys = extractYears(after);
    return ys.length >= 2 && ys[ys.length - 1] <= ys[0] + 1;
  })();

  const checks = [
    { label: 'Experience section detected', points: 15, passed: !!expText, detail: expText ? 'Work history section found and parsed.' : 'No work experience section was detected — this is the core section every ATS looks for first.' },
    { label: 'Sufficient achievement bullets (8+)', points: 15, passed: bullets.length >= 8, detail: `${bullets.length} substantive bullet statements found. Aim for 8–15 across your roles.` },
    { label: 'Bullets open with strong action verbs', points: 25, passed: verbBullets.length / (bullets.length || 1) >= 0.6, detail: `${verbBullets.length}/${bullets.length || 1} bullets open with a high-impact verb (${pct(verbBullets.length, bullets.length || 1)}%). Target 60%+.` },
    { label: 'Achievements are quantified', points: 30, passed: quantified.length / (bullets.length || 1) >= 0.4, detail: `${quantified.length}/${bullets.length || 1} bullets contain a metric (${pct(quantified.length, bullets.length || 1)}%). Recruiters shortlist measurable impact — target 40%+.` },
    { label: 'Employment timeline with dates', points: 10, passed: chronological, detail: chronological ? `Timeline spans ${ctx.years[0]}–${ctx.years[ctx.years.length - 1]}.` : 'Add month/year ranges for every role so ATS can compute total and per-role tenure.' },
    { label: 'No passive / weak phrasing', points: 5, passed: weakHits.length === 0, detail: weakHits.length ? `Weak phrases found: ${weakHits.map((w) => `“${w.phrase}”`).join(', ')}.` : 'No common weak phrases detected.' },
  ];
  // partial credit for ratio-based checks
  checks[2].partial = clamp(verbBullets.length / (bullets.length || 1) / 0.6, 0, 1);
  checks[3].partial = clamp(quantified.length / (bullets.length || 1) / 0.4, 0, 1);
  checks[1].partial = clamp(bullets.length / 8, 0, 1);

  return {
    ...buildDimension('experience', 'Work Experience', 15, checks, (score) =>
      score >= 80 ? 'Your experience section is achievement-led and well structured.' : score >= 55 ? 'The history is there, but impact and metrics are under-sold.' : 'Your experience section reads as a task list, not a results story.'
    ),
    data: { bullets, verbBullets, quantified, weakHits },
  };
}

function scoreEducation(ctx) {
  const edu = ctx.joined.education || '';
  const text = ctx.text;
  const degree = /\b(b\.?(tech|e|sc|com|arch|pharm|a)|bachelor|bachelors|master|m\.?(tech|sc|e|ba|com)|mba|phd|diploma|associate(?:\s+degree)?|high\s+school|bsc|msc|bca|mca|be\b|me\b|dual\s+degree)\b/i.test(edu || text);
  const institution = /\b(university|college|institute|school\s+of|academy|iit|nit|iiit|bits|vit|srm|amity|manipal|stanford|mit|oxford|cambridge|harvard)\b/i.test(edu || text);
  const year = /\b(19|20)\d{2}\b/.test(edu);
  const field = /\b(computer science|information technology|electronics|electrical|mechanical|civil|business administration|commerce|mathematics|statistics|economics|physics|chemistry|biology|accounting|finance|marketing|human resources|design|arts|data science|software engineering|communications?|law)\b/i.test(edu || text);
  const gpaOrPct = /(\b(gpa|cgpa)\b|\d{1,2}\.\d{1,2}\s*\/\s*\d{1,2}|\d{1,2}\.\d{1,2}\s*%|\d{1,2}\s*%)/i.test(edu);
  const heading = !!ctx.joined.education;

  const checks = [
    { label: 'Education section with heading', points: 25, passed: heading, detail: heading ? 'Dedicated Education section found.' : 'No “Education” heading — ATS cannot fill the mandatory education field without it.' },
    { label: 'Degree name stated', points: 30, passed: degree, detail: degree ? 'A degree keyword was recognised (B.Tech / BSc / Master / MBA etc.).' : 'State the exact degree title (e.g. “Bachelor of Technology in Computer Science”) — “B.Tech” alone is ambiguous to some parsers.' },
    { label: 'Institution named', points: 20, passed: institution, detail: institution ? 'Institution keyword found.' : 'Add the full name of your university or college.' },
    { label: 'Field of study included', points: 15, passed: field, detail: field ? 'Field of study recognised.' : 'Include your major/specialisation so degree-based filters match you.' },
    { label: 'Graduation year present', points: 10, passed: year, detail: year ? 'Graduation year detected.' : 'Add your graduation year — many ATS sort freshers by pass-out batch.' },
  ];
  const dim = buildDimension('education', 'Education', 8, checks, (s) =>
    s >= 80 ? 'Education block is complete and parseable.' : s >= 50 ? 'Education details are partially complete.' : 'Education data is too sparse for ATS degree filters.'
  );
  dim.data = { gpaOrPct };
  return dim;
}

function scoreStructure(ctx) {
  const found = new Set(ctx.order);
  const expected = ['contact', 'summary', 'skills', 'experience', 'education'];
  const extras = ['projects', 'certifications', 'achievements', 'publications'];
  const orderIdx = ctx.order.map((k) => CANONICAL_ORDER.indexOf(k)).filter((i) => i >= 0);
  let monotonic = true;
  for (let i = 1; i < orderIdx.length; i++) if (orderIdx[i] < orderIdx[i - 1]) monotonic = false;

  const checks = [
    { label: 'Contact header at the top', points: 15, passed: !!ctx.contact.email || !!ctx.contact.phone, detail: 'Contact details must sit at the very top of the document, never in a header/footer.' },
    { label: 'Professional summary section', points: 20, passed: found.has('summary'), detail: found.has('summary') ? 'Summary section found.' : 'A 2–3 line summary is the highest-value real estate for keywords.' },
    { label: 'Skills section', points: 15, passed: found.has('skills'), detail: found.has('skills') ? 'Skills section found.' : 'Missing a dedicated skills section.' },
    { label: 'Experience section', points: 15, passed: found.has('experience'), detail: found.has('experience') ? 'Experience section found.' : 'Missing a work experience section.' },
    { label: 'Education section', points: 10, passed: found.has('education'), detail: found.has('education') ? 'Education section found.' : 'Missing an education section.' },
    { label: 'Supporting sections (projects / certifications)', points: 15, passed: extras.some((e) => found.has(e)), detail: extras.filter((e) => found.has(e)).length ? `Supporting sections found: ${extras.filter((e) => found.has(e)).join(', ')}.` : 'For early-career candidates, Projects and Certifications carry a lot of ATS keyword weight.' },
    { label: 'Sections follow the expected reading order', points: 10, passed: monotonic, detail: monotonic ? 'Section order matches the conventional resume layout ATS expects.' : 'Sections appear out of the conventional order — put summary before skills before experience.' },
  ];

  return buildDimension('structure', 'Section Structure', 12, checks, (s) =>
    s >= 80 ? 'Your resume has all the sections ATS expects, in the right order.' : s >= 50 ? 'Core sections exist but some expected blocks are missing.' : 'Missing standard sections — ATS field mapping will be incomplete.'
  );
}

function scoreReadability(ctx) {
  const bullets = ctx.allBullets;
  const avgWordsPerBullet = bullets.length ? bullets.reduce((s, b) => s + b.split(/\s+/).length, 0) / bullets.length : 0;
  const longBullets = bullets.filter((b) => b.split(/\s+/).length > 30).length;
  const words = ctx.stats.wordCount;
  const longWords = (ctx.text.match(/\b[a-z]{15,}\b/gi) || []).length;
  const buzzHits = BUZZWORDS.filter((b) => ctx.textLower.includes(b));
  const passiveHits = (ctx.textLower.match(/\b(was|were|been|being|am|is|are)\s+\w+(ed|en)\b/g) || []).length;
  const idealBullet = avgWordsPerBullet >= 10 && avgWordsPerBullet <= 26;

  const checks = [
    { label: 'Average bullet length 10–26 words', points: 30, passed: idealBullet, detail: `Average: ${avgWordsPerBullet.toFixed(1)} words per bullet. ${avgWordsPerBullet < 10 ? 'Too terse to convey impact — add context and outcome.' : avgWordsPerBullet > 26 ? 'Too long — split into two focused bullets.' : 'Ideal scanning length.'}` },
    { label: 'No over-long bullets (30+ words)', points: 15, passed: longBullets === 0, detail: longBullets ? `${longBullets} bullet(s) exceed 30 words and will not be read.` : 'All bullets stay within a scannable length.' },
    { label: 'Avoids cliché buzzwords', points: 20, passed: buzzHits.length === 0, detail: buzzHits.length ? `Clichés found: ${buzzHits.map((b) => `“${b}”`).join(', ')}. Replace with evidence.` : 'No empty buzzwords detected.' },
    { label: 'Active voice dominates', points: 20, passed: passiveHits <= 2, detail: passiveHits > 2 ? `${passiveHits} passive constructions found — rewrite as “Subject + strong verb + result”.` : 'Voice is predominantly active.' },
    { label: 'Readable vocabulary', points: 15, passed: longWords / (words || 1) < 0.02, detail: longWords > words * 0.02 ? 'A high share of very long words reduces skimmability.' : 'Word choice is clear and skimmable.' },
  ];

  return {
    ...buildDimension('readability', 'Readability', 12, checks, (s) =>
      s >= 80 ? 'A recruiter can skim this resume in under 30 seconds.' : s >= 55 ? 'Readable, but several blocks will slow a recruiter down.' : 'Dense and hard to scan — recruiters spend ~7 seconds per resume.'
    ),
    data: { avgWordsPerBullet: +avgWordsPerBullet.toFixed(1), buzzHits, passiveHits, longBullets },
  };
}

/* ============================== QUALITY ============================== */

function qualityChecks(ctx) {
  const grammar = [];
  const textLower = ctx.textLower;

  for (const [wrong, right] of Object.entries(MISSPELLINGS)) {
    const re = new RegExp(`\\b${esc(wrong)}\\b`, 'gi');
    const m = textLower.match(re);
    if (m) {
      const idx = textLower.search(re);
      grammar.push({
        type: 'spelling',
        issue: `“${wrong}” appears ${m.length}×`,
        suggestion: `Replace with “${right}”`,
        excerpt: ctx.text.slice(Math.max(0, idx - 30), idx + wrong.length + 30).replace(/\s+/g, ' ').trim(),
      });
    }
  }

  const dblSpace = (ctx.text.match(/\S {2,}\S/g) || []).length;
  if (dblSpace) grammar.push({ type: 'spacing', issue: `${dblSpace} double-space occurrence(s)`, suggestion: 'Use single spacing between words', excerpt: '—' });

  const repeated = ctx.text.match(/\b(\w{3,})\s+\1\b/gi) || [];
  for (const r of repeated.slice(0, 5)) {
    grammar.push({ type: 'repetition', issue: `Repeated word “${r.trim()}”`, suggestion: 'Remove the duplicate word', excerpt: r });
  }

  const missingSpace = ctx.text.match(/[a-z],[a-z]/g) || [];
  if (missingSpace.length) grammar.push({ type: 'spacing', issue: `${missingSpace.length} missing space(s) after a comma`, suggestion: 'Add a space after every comma', excerpt: missingSpace[0] });

  const pronoun = (textLower.match(/(^|[^a-z])i\s+(led|built|managed|worked|was|am|have|did|created|designed)/g) || []).length;
  if (pronoun) grammar.push({ type: 'style', issue: `${pronoun} first-person “I …” construction(s)`, suggestion: 'Drop the pronoun: “Led …” not “I led …”', excerpt: '—' });

  const inconsistent = ctx.text.match(/\bResume\b/g) || [];
  if (inconsistent.length >= 1 && /\brésumé\b/i.test(ctx.text)) {
    grammar.push({ type: 'consistency', issue: 'Mixed spellings of “resume / résumé”', suggestion: 'Pick one spelling and use it consistently', excerpt: '—' });
  }

  // weak verbs
  const bullets = ctx.allBullets;
  const weakVerbs = WEAK_PHRASES.map((w) => {
    const re = new RegExp(esc(w.phrase), 'gi');
    const count = (ctx.textLower.match(re) || []).length;
    if (!count) return null;
    const inBullets = bullets.filter((b) => b.toLowerCase().includes(w.phrase));
    return { phrase: w.phrase, count, alternatives: w.alternatives, fix: w.fix, examples: inBullets.slice(0, 2) };
  }).filter(Boolean);

  const quantifiedCount = ctx.expData.quantified.length;
  const totalBullets = ctx.expData.bullets.length;
  const ratio = totalBullets ? quantifiedCount / totalBullets : 0;

  const sectionCompleteness = [
    { section: 'Contact header', present: !!ctx.contact.email && !!ctx.contact.phone, note: 'Name, email, phone, city and links.' },
    { section: 'Professional summary', present: !!ctx.joined.summary, note: '2–3 line positioning statement with top keywords.' },
    { section: 'Skills', present: !!ctx.joined.skills, note: 'Dense, category-grouped hard skills.' },
    { section: 'Work experience', present: !!ctx.joined.experience, note: 'Role, company, dates, 3–5 quantified bullets each.' },
    { section: 'Projects', present: !!ctx.joined.projects, note: 'Especially valuable for students and freshers.' },
    { section: 'Education', present: !!ctx.joined.education, note: 'Degree, institution, field, year.' },
    { section: 'Certifications', present: !!ctx.joined.certifications, note: 'Courses and licences add keyword weight.' },
    { section: 'Achievements / awards', present: !!ctx.joined.achievements, note: 'Competitions, hackathons, scholarships.' },
  ];

  const formattingIssues = [];
  const pipes = pipeCountOutsideHeader(ctx.text);
  if (pipes > 2) formattingIssues.push({ issue: `${pipes} pipe characters suggest a table or column layout`, fix: 'Rebuild as a single-column layout — tables get scrambled by most ATS.', severity: 'high' });
  if ((ctx.text.match(/\t/g) || []).length) formattingIssues.push({ issue: 'Tab characters detected (likely column alignment)', fix: 'Replace tabs with single spaces and let line breaks do the layout.', severity: 'high' });
  const special = exoticCharCount(ctx.text);
  if (special > 6) formattingIssues.push({ issue: `${special} non-standard characters found`, fix: 'Stick to plain ASCII text, standard bullets (•, -) and no emoji/symbols.', severity: 'medium' });
  const capsLines = ctx.lines.filter((l) => l === l.toUpperCase() && l.split(/\s+/).length > 6).length;
  if (capsLines) formattingIssues.push({ issue: `${capsLines} fully-capitalised paragraph line(s)`, fix: 'Reserve all-caps for section headings only — it harms readability and can confuse parsers.', severity: 'low' });
  const longLines = ctx.lines.filter((l) => l.length > 160).length;
  if (longLines) formattingIssues.push({ issue: `${longLines} extremely long line(s)`, fix: 'Break paragraphs into bullets of 1–2 lines.', severity: 'medium' });
  if (!ctx.contact.linkedin) formattingIssues.push({ issue: 'No LinkedIn profile link', fix: 'Add your LinkedIn URL under your name — it is the most-clicked link on a resume.', severity: 'low' });
  if (ctx.stats.wordCount > 1000) formattingIssues.push({ issue: `Resume is ${ctx.stats.wordCount} words (over 2 pages)`, fix: 'Trim older roles and merge overlapping achievements to fit 2 pages.', severity: 'medium' });
  if (ctx.stats.wordCount < 300) formattingIssues.push({ issue: `Resume is only ${ctx.stats.wordCount} words`, fix: 'Expand with project detail, internships and quantified achievements.', severity: 'high' });

  return {
    grammar: grammar.slice(0, 20),
    weakVerbs,
    quantified: {
      bulletsWithMetrics: quantifiedCount,
      totalBullets,
      ratio: +ratio.toFixed(2),
      status: ratio >= 0.5 ? 'Strong' : ratio >= 0.3 ? 'Average' : 'Weak',
      examples: ctx.expData.bullets.filter((b) => !/\d/.test(b)).slice(0, 3),
    },
    sectionCompleteness,
    formattingIssues,
  };
}

/* ============================== JOB MATCH ============================== */

function jobMatch(ctx) {
  if (!ctx.hasJD) {
    return {
      hasJD: false,
      compatibility: null,
      requiredSkillsFound: [],
      missingTechnical: [],
      missingSoft: [],
      requiredYears: null,
      resumeYears: ctx.resumeYears,
      experienceVerdict: 'Add a job description to measure exact role compatibility.',
      matchedJdKeywords: [],
      missingJdKeywords: [],
      titleMatch: false,
    };
  }

  const jdLower = ctx.jd.toLowerCase();
  const jdSkills = ctx.jdSkills;
  const resumeSkillNames = new Set(mineSkills(ctx.text).map((s) => s.name));
  const roleHard = new Set(ctx.role.hardSkills.map((s) => s.toLowerCase()));

  const required = [];
  const seen = new Set();
  for (const s of jdSkills) {
    if (!seen.has(s.name)) { required.push(s); seen.add(s.name); }
  }
  for (const s of ctx.role.hardSkills) {
    if (!seen.has(s.toLowerCase())) { required.push({ name: s, category: SKILL_TAXONOMY[s] || 'role' }); seen.add(s.toLowerCase()); }
  }

  const found = required.filter((s) => resumeSkillNames.has(s.name) || matchSkill(ctx.textLower, s.name));
  const missingTech = required.filter((s) => !found.includes(s) && s.category !== 'soft');

  const jdSoft = SOFT_SKILLS.filter((s) => hasTerm(jdLower, s));
  const missingSoft = jdSoft.filter((s) => !hasTerm(ctx.textLower, s));

  const jdTerms = ctx.jdKeywords.map((k) => k.term);
  const matchedJd = jdTerms.filter((k) => hasTerm(ctx.text, k));
  const missingJd = jdTerms.filter((k) => !hasTerm(ctx.text, k));

  const requiredYears = ctx.requiredYears;
  const resumeYears = ctx.resumeYears;
  let experienceVerdict;
  if (requiredYears == null) experienceVerdict = 'This posting does not state a minimum number of years of experience.';
  else if (resumeYears >= requiredYears) experienceVerdict = `You clear the bar: the posting asks for ${requiredYears}+ years and your resume shows ~${resumeYears} years of relevant history.`;
  else experienceVerdict = `Experience gap: the posting asks for ${requiredYears}+ years, your resume evidences ~${resumeYears} year(s). Strengthen internships, freelance and project work.`;

  const skillCoverage = required.length ? found.length / required.length : 0;
  const keywordCoverage = jdTerms.length ? matchedJd.length / jdTerms.length : 0;
  const yearScore = requiredYears == null ? 0.7 : clamp(resumeYears / Math.max(requiredYears, 1), 0, 1);
  const softCoverage = jdSoft.length ? (jdSoft.length - missingSoft.length) / jdSoft.length : 0.7;

  const compatibility = Math.round(
    clamp(skillCoverage * 55 + keywordCoverage * 25 + yearScore * 10 + softCoverage * 10, 0, 100)
  );

  const jdTitle = (ctx.jd.match(/\b([a-z ]{3,40}\s(engineer|developer|analyst|manager|designer|scientist|specialist|consultant|associate|intern|lead|architect|executive))\b/i) || [null])[0];
  const titleMatch = !!(jdTitle && hasTerm(ctx.text, jdTitle.trim()));

  return {
    hasJD: true,
    compatibility,
    requiredSkillsFound: found,
    missingTechnical: missingTech,
    missingSoft,
    requiredYears,
    resumeYears,
    experienceVerdict,
    matchedJdKeywords: matchedJd,
    missingJdKeywords: missingJd,
    titleMatch,
    detectedTitle: jdTitle ? jdTitle.trim() : null,
  };
}

/* ============================== RECOMMENDATIONS ============================== */

function pickTopSkills(list, n) {
  return list.slice(0, n);
}

function buildRecommendations(ctx, dims, quality, match) {
  const recs = [];
  const roleLabel = ctx.roleLabel;
  const resumeSkillNames = mineSkills(ctx.text).map((s) => s.name);
  const topSkills = resumeSkillNames.slice(0, 6);

  // 1. Summary
  const summaryText = (ctx.joined.summary || '').trim();
  const summaryWords = summaryText ? summaryText.split(/\s+/).length : 0;
  if (!summaryText) {
    recs.push({
      id: 'summary-missing',
      section: 'Professional Summary',
      title: 'Add a keyword-rich professional summary',
      priority: 'high',
      description: `Your resume has no summary section. The summary is the first block an ATS indexes and the first thing a recruiter reads — it should name your target role (${roleLabel}), your years of experience and your three strongest technical keywords.`,
      before: '(no summary section present)',
      after: `${roleLabel} with ${ctx.resumeYears || 1} year(s) of hands-on experience${topSkills.length ? ` across ${topSkills.slice(0, 3).join(', ')}` : ''}. Delivered measurable results in ${ctx.role.keywords.slice(0, 2).join(' and ')}. Seeking to apply ${topSkills[0] || 'core'} expertise to drive [business outcome].`,
      note: 'Replace the [business outcome] placeholder with a real result you own. Keep it to 2–3 lines.',
      tags: ['structure', 'keywords'],
    });
  } else if (summaryWords < 25) {
    recs.push({
      id: 'summary-thin',
      section: 'Professional Summary',
      title: 'Expand your summary — it is too thin to carry keywords',
      priority: 'medium',
      description: `A ${summaryWords}-word summary gives the ATS almost nothing to index. Target 40–70 words that state your role, seniority, stack and one measurable win.`,
      before: summaryText.split('\n')[0].slice(0, 160),
      after: `${roleLabel} with ${ctx.resumeYears || 1}+ years building and shipping ${ctx.role.hardSkills.slice(0, 2).join(' and ')} solutions. ${topSkills.length ? `Specialised in ${topSkills.slice(0, 3).join(', ')}. ` : ''}Known for [quantified achievement — e.g. cutting latency 40% or growing conversion 18%].`,
      tags: ['keywords', 'content'],
    });
  }

  // 2. Weak verbs — real before/after rewrites from the resume
  for (const w of quality.weakVerbs.slice(0, 3)) {
    const example = w.examples[0];
    if (example) {
      const re = new RegExp(esc(w.phrase), 'i');
      const rewritten = example.replace(re, w.alternatives[0]);
      recs.push({
        id: `weak-${w.phrase.replace(/\s+/g, '-')}`,
        section: 'Work Experience',
        title: `Replace “${w.phrase}” with a stronger verb`,
        priority: w.count > 2 ? 'high' : 'medium',
        description: `${w.fix} This phrase appears ${w.count} time(s) in your resume. Strong alternatives: ${w.alternatives.join(', ')}.`,
        before: example,
        after: `${rewritten}${/\d/.test(rewritten) ? '' : ', [quantified result — e.g. 30% faster / 5K users / $20K saved]'}`,
        tags: ['action-verbs'],
      });
    } else {
      recs.push({
        id: `weak-${w.phrase.replace(/\s+/g, '-')}`,
        section: 'Work Experience',
        title: `Replace “${w.phrase}” with a stronger verb`,
        priority: 'medium',
        description: `${w.fix} Strong alternatives: ${w.alternatives.join(', ')}.`,
        tags: ['action-verbs'],
      });
    }
  }

  // 3. Quantification
  if (quality.quantified.ratio < 0.4) {
    const ex = quality.quantified.examples[0];
    recs.push({
      id: 'quantify',
      section: 'Work Experience',
      title: `Quantify your achievements (only ${Math.round(quality.quantified.ratio * 100)}% of bullets have metrics)`,
      priority: 'high',
      description: `${quality.quantified.totalBullets - quality.quantified.bulletsWithMetrics} of your ${quality.quantified.totalBullets} bullets contain no number. Recruiters rank measurable impact far above task descriptions — add scale, percentage, time saved, revenue or user counts.`,
      before: ex || '(bullet without any metric)',
      after: ex
        ? `${ex.replace(/[.]$/, '')}, [metric — e.g. serving 12K monthly users, cutting build time 45%, or saving $30K/year]`
        : 'Reduced API response time by 38% (820ms → 510ms) by adding Redis caching and query indexes',
      tags: ['impact', 'metrics'],
    });
  }

  // 4. Missing keywords / skills
  const missingKeywords = dims.find((d) => d.key === 'keywords');
  const missingKw = (missingKeywords?.data?.missingRole || []).slice(0, 10);
  if (missingKw.length) {
    recs.push({
      id: 'keywords-gap',
      section: 'Keywords',
      title: `Add ${Math.min(missingKw.length, 10)} missing ${roleLabel} keywords`,
      priority: 'high',
      description: `These expected terms are absent from your resume: ${missingKw.join(', ')}. ATS keyword ranking is literal — if the word is not in your document, you do not match for it. Work them into your summary, skills section and bullets where they are genuinely true for you.`,
      tags: ['keywords'],
    });
  }

  const skillsDim = dims.find((d) => d.key === 'skills');
  const missingSkills = (skillsDim?.data?.missing || []).slice(0, 12);
  if (missingSkills.length) {
    recs.push({
      id: 'skills-gap',
      section: 'Skills',
      title: 'Close the hard-skill gap for this role',
      priority: missingSkills.length > 5 ? 'high' : 'medium',
      description: `The following expected skills are not present: ${missingSkills.join(', ')}. Add the ones you genuinely have to a grouped Skills section (Languages / Frameworks / Tools / Cloud). For the rest, consider a targeted certification or project so you can legitimately claim them.`,
      tags: ['skills'],
    });
  }

  // 5. Missing sections
  for (const s of quality.sectionCompleteness.filter((s) => !s.present)) {
    if (['Professional summary', 'Skills', 'Work experience', 'Education'].includes(s.section)) {
      recs.push({
        id: `section-${s.section.toLowerCase().replace(/\s+/g, '-')}`,
        section: s.section,
        title: `Add a ${s.section} section`,
        priority: 'high',
        description: `${s.note} ATS maps sections to database fields; a missing section leaves that field blank and can auto-reject your application.`,
        tags: ['structure'],
      });
    }
  }

  // 6. Formatting issues
  for (const f of quality.formattingIssues.slice(0, 4)) {
    if (f.severity === 'low') continue;
    recs.push({
      id: `format-${f.issue.slice(0, 28).replace(/\s+/g, '-')}`,
      section: 'ATS Formatting',
      title: f.issue,
      priority: f.severity === 'high' ? 'high' : 'medium',
      description: f.fix,
      tags: ['formatting'],
    });
  }

  // 7. Readability
  const read = dims.find((d) => d.key === 'readability');
  if (read && read.data?.buzzHits?.length) {
    recs.push({
      id: 'buzzwords',
      section: 'Content Quality',
      title: 'Replace clichés with evidence',
      priority: 'medium',
      description: `These phrases are so overused that recruiters filter them out: ${read.data.buzzHits.map((b) => `“${b}”`).join(', ')}. Swap each for a concrete fact.`,
      before: 'Hard-working team player with a passion for results',
      after: 'Coordinated a 6-person pod that shipped 4 releases per quarter with zero rollbacks',
      tags: ['readability'],
    });
  }

  // 8. JD match guidance
  if (match.hasJD) {
    if (match.missingTechnical.length) {
      recs.push({
        id: 'jd-tech-gap',
        section: 'Job Description Match',
        title: 'Address the technical gaps this posting screens for',
        priority: 'high',
        description: `The posting explicitly looks for ${match.missingTechnical.slice(0, 10).map((s) => s.name).join(', ')} — none of which appear in your resume. Even one line of real, hands-on experience with each raises your match score materially.`,
        tags: ['job-match', 'skills'],
      });
    }
    if (match.missingSoft.length) {
      recs.push({
        id: 'jd-soft-gap',
        section: 'Job Description Match',
        title: 'Evidence the soft skills this employer values',
        priority: 'low',
        description: `The job description names ${match.missingSoft.join(', ')}. Show — don't tell — these through achievements (mentored, presented, negotiated, coordinated).`,
        tags: ['job-match'],
      });
    }
    if (match.compatibility < 70) {
      recs.push({
        id: 'jd-mirror',
        section: 'Job Description Match',
        title: `Mirror the posting's exact wording (current match ${match.compatibility}%)`,
        priority: 'high',
        description: `Language the posting uses that your resume does not: ${match.missingJdKeywords.slice(0, 12).join(', ') || '(few gaps — your keyword mirroring is already strong)'}. ATS matchers reward exact phrase matches, so use the posting's vocabulary verbatim where it is true for you.`,
        tags: ['job-match', 'keywords'],
      });
    }
  }

  // 9. Education nudge
  if (!ctx.joined.education) {
    recs.push({
      id: 'education-detail',
      section: 'Education',
      title: 'Spell out your degree completely',
      priority: 'medium',
      description: 'Write the full degree name, field of study, institution and graduation year (e.g. “B.Tech in Computer Science, XYZ University, 2025 — CGPA 8.6/10”). Abbreviations alone make degree filters fail.',
      tags: ['education'],
    });
  }

  const priorityRank = { high: 0, medium: 1, low: 2 };
  return recs
    .filter((r) => r.title)
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .map((r, i) => ({ ...r, id: r.id || `rec-${i}` }))
    .slice(0, 18);
}

/* ============================== MAIN ENTRY ============================== */

export function analyzeResume({ resumeText, jobDescription = '', targetRole = 'generic', fileName = '' }) {
  if (!resumeText || resumeText.trim().length < 40) {
    throw new Error('Resume text is too short to analyse. Provide at least a few lines of real resume content.');
  }

  const text = resumeText.replace(/\u00a0/g, ' ');
  const textLower = text.toLowerCase();
  const roleKey = ROLES[targetRole] ? targetRole : 'generic';
  const role = ROLES[roleKey];
  const roleLabel = role.label;

  const parsed = parseSections(text);
  const stats = {
    wordCount: text.split(/\s+/).filter(Boolean).length,
    bulletCount: extractBullets(text).length,
    lineCount: parsed.lines.length,
    estimatedPages: Math.max(1, Math.ceil(parsed.lines.length / 46)),
    readingTimeSec: Math.round(text.split(/\s+/).filter(Boolean).length / 3.5),
    charCount: text.length,
  };

  const contact = detectContact(text);
  const years = extractYears(text);
  const headingLabels = parsed.headingLines.map((h) => h.line);
  const allBullets = extractBullets(text);
  const jdSkills = jobDescription ? mineSkills(jobDescription) : [];
  const jdKeywords = jobDescription ? extractJdKeywords(jobDescription) : [];

  const expDraft = scoreExperience({
    ...{},
    joined: parsed.joined,
    text,
    years,
    lines: parsed.lines,
    headingLines: parsed.headingLines,
  });

  const ctx = {
    text,
    textLower,
    role,
    roleLabel,
    hasJD: !!(jobDescription && jobDescription.trim().length > 60),
    jd: jobDescription || '',
    jdSkills,
    jdKeywords,
    requiredYears: extractRequiredYears(jobDescription || ''),
    joined: parsed.joined,
    order: parsed.order,
    lines: parsed.lines,
    headingLines: parsed.headingLines,
    headingLabels,
    foundHeadings: new Set(parsed.headingLines.map((h) => h.section)).size,
    contact,
    years,
    stats,
    allBullets,
    resumeYears: (() => {
      const expYears = extractYears(parsed.joined.experience || '');
      const base = expYears.length >= 2 ? expYears : expYears.length === 1 ? [expYears[0], CURRENT_YEAR] : [];
      if (!base.length) return 0;
      return Math.max(0, Math.min(CURRENT_YEAR - base[0], base[base.length - 1] - base[0] + 1));
    })(),
    consistentBullets: (() => {
      const markers = new Set(text.split('\n').filter((l) => /^\s*[•▪◦‣·∙*\-]/.test(l)).map((l) => l.trim()[0]));
      return markers.size <= 1;
    })(),
    expData: expDraft.data,
  };

  const dims = [
    scoreFormatting(ctx),
    scoreKeywords(ctx),
    scoreSkills(ctx),
    expDraft,
    scoreEducation(ctx),
    scoreStructure(ctx),
    scoreReadability(ctx),
  ];

  const totalWeight = dims.reduce((s, d) => s + d.weight, 0);
  const overallScore = Math.round(dims.reduce((s, d) => s + d.score * d.weight, 0) / totalWeight);

  const rating =
    overallScore >= 85 ? 'Excellent' : overallScore >= 70 ? 'Good' : overallScore >= 55 ? 'Average' : 'Needs Improvement';
  const ratingDetail = {
    Excellent: 'Your resume is highly ATS-optimized. Expect strong keyword ranking and clean parsing across systems.',
    Good: 'A solid, parseable resume with a few fixable gaps. Address the high-priority items to push past 85.',
    Average: 'Your resume will parse, but keyword ranking will keep you behind optimized candidates.',
    'Needs Improvement': 'Structural and keyword problems are likely causing automatic rejections. Work through the high-priority fixes first.',
  }[rating];

  const quality = qualityChecks(ctx);
  const match = jobMatch(ctx);
  const recommendations = buildRecommendations(ctx, dims, quality, match);

  /* Keyword analysis block */
  const roleKw = role.keywords;
  const kwSource = (term) => {
    const inRole = roleKw.includes(term);
    const inJd = ctx.hasJD && ctx.jdKeywords.some((k) => k.term === term);
    return inRole && inJd ? 'both' : inJd ? 'job' : 'role';
  };

  const matchedSet = new Set([
    ...roleKw.filter((k) => hasTerm(text, k)),
    ...(ctx.hasJD ? ctx.jdKeywords.map((k) => k.term).filter((t) => hasTerm(text, t)) : []),
  ]);
  const missingSet = new Set([
    ...roleKw.filter((k) => !hasTerm(text, k)),
    ...(ctx.hasJD ? ctx.jdKeywords.map((k) => k.term).filter((t) => !hasTerm(text, t)) : []),
  ]);

  const matched = [...matchedSet].map((term) => ({
    term,
    count: countTerm(text, term),
    source: kwSource(term),
    importance: kwSource(term) === 'both' ? 'high' : 'medium',
  })).sort((a, b) => b.count - a.count);

  const missing = [...missingSet]
    .map((term) => ({ term, count: 0, source: kwSource(term), importance: kwSource(term) === 'both' ? 'high' : 'medium' }))
    .sort((a, b) => {
      const rank = { high: 0, medium: 1 };
      return rank[a.importance] - rank[b.importance] || b.term.length - a.term.length;
    });

  const recommended = pickTopSkills(
    missing.filter((m) => m.source !== 'job' || m.importance === 'high'),
    12
  );

  const frequency = matched.slice(0, 25).map((m) => ({ term: m.term, count: m.count }));

  const keywords = {
    matched,
    missing: missing.slice(0, 30),
    recommended,
    frequency,
    coverage: pct(matchedSet.size, matchedSet.size + missingSet.size || 1),
  };

  return {
    meta: {
      engine: ENGINE_VERSION,
      fileName: fileName || null,
      targetRole: roleKey,
      roleLabel,
      hasJD: ctx.hasJD,
      analyzedAt: new Date().toISOString(),
      deterministic: true,
    },
    overallScore,
    rating,
    ratingDetail,
    dimensions: dims.map((d) => ({ key: d.key, label: d.label, weight: d.weight, score: d.score, summary: d.summary, checks: d.checks })),
    keywords,
    jobMatch: match,
    quality,
    recommendations,
    stats: { ...stats, sections: parsed.order, resumeYears: ctx.resumeYears, matchedSkills: ctx.role.hardSkills.filter((s) => hasTerm(text, s)) },
  };
}

export const ROLE_OPTIONS = Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label }));

export function analyzeResumeSafe(input) {
  try {
    return { ok: true, result: analyzeResume(input) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
