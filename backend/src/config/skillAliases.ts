/**
 * Skill alias map — maps common alternate names to canonical normalized form.
 * All keys and values are lowercase.
 */
export const SKILL_ALIASES: Record<string, string> = {
  // JavaScript ecosystem
  js: 'javascript',
  'node.js': 'nodejs',
  node: 'nodejs',
  'express.js': 'express',
  expressjs: 'express',
  'react.js': 'react',
  reactjs: 'react',
  'react native': 'react-native',
  'next.js': 'nextjs',
  'nuxt.js': 'nuxtjs',
  'vue.js': 'vue',
  vuejs: 'vue',
  'angular.js': 'angular',
  angularjs: 'angular',
  ts: 'typescript',
  jquery: 'jquery',

  // Python
  py: 'python',
  python3: 'python',

  // CSS
  'tailwind css': 'tailwindcss',
  tailwind: 'tailwindcss',
  'bootstrap css': 'bootstrap',
  scss: 'sass',

  // Databases
  mongo: 'mongodb',
  'mongo db': 'mongodb',
  postgres: 'postgresql',
  pg: 'postgresql',
  mysql: 'mysql',
  mssql: 'sql server',
  'ms sql': 'sql server',
  redis: 'redis',
  elastic: 'elasticsearch',

  // Cloud / DevOps
  aws: 'amazon web services',
  gcp: 'google cloud platform',
  'google cloud': 'google cloud platform',
  k8s: 'kubernetes',
  'docker compose': 'docker',

  // AI / ML
  'machine learning': 'ml',
  'deep learning': 'dl',
  'natural language processing': 'nlp',
  'gen ai': 'generative ai',
  'openai api': 'openai',
  langchain: 'langchain',
  tensorflow: 'tensorflow',
  pytorch: 'pytorch',
  'hugging face': 'huggingface',
  hf: 'huggingface',
  'large language model': 'llm',
  'large language models': 'llm',
  'retrieval augmented generation': 'rag',
  'retrieval-augmented generation': 'rag',
  'agentic rag': 'rag',

  // Soft / business skills
  'problem-solving': 'problem solving',
  'critical-thinking': 'critical thinking',
  'customer service': 'customer success',
  'client success': 'customer success',
  'account management': 'customer success',
  'software as a service': 'saas',
  'customer relationship management': 'crm',
  'business to business': 'b2b',
  'business-to-business': 'b2b',
  'business to consumer': 'b2c',
  'business-to-consumer': 'b2c',

  // Tools
  vscode: 'visual studio code',
  'vs code': 'visual studio code',
  sql: 'sql',
  html5: 'html',
  css3: 'css',
  git: 'git',
  github: 'github',
  graphql: 'graphql',
  'rest api': 'rest',
  restful: 'rest',
  'ci/cd': 'ci/cd',
  cicd: 'ci/cd',
  'object oriented programming': 'oop',
  oop: 'oop',
  dsa: 'data structures and algorithms',

  // Mobile
  flutter: 'flutter',
  'react-native': 'react-native',
  ios: 'ios',
  android: 'android',

  // Testing
  jest: 'jest',
  mocha: 'mocha',
  cypress: 'cypress',
  selenium: 'selenium',
};

/**
 * Composite skill → component skills.
 * When a candidate has a composite skill, we automatically add all its components.
 * Keys are normalized (lowercase).
 */
export const SKILL_EXPANSIONS: Record<string, string[]> = {
  'mern stack': ['mongodb', 'express', 'react', 'nodejs'],
  mern: ['mongodb', 'express', 'react', 'nodejs'],
  'mean stack': ['mongodb', 'express', 'angular', 'nodejs'],
  mean: ['mongodb', 'express', 'angular', 'nodejs'],
  'full stack': ['html', 'css', 'javascript', 'nodejs'],
  'full-stack': ['html', 'css', 'javascript', 'nodejs'],
  rag: ['python', 'llm', 'vector database', 'embeddings'],
  'agentic rag': ['python', 'llm', 'langchain', 'rag'],
  'generative ai': ['python', 'llm', 'openai', 'langchain', 'ml'],
  'gen ai': ['python', 'llm', 'openai'],
  ml: ['python', 'data analysis', 'statistics'],
  dl: ['python', 'ml', 'tensorflow', 'pytorch'],
  nlp: ['python', 'ml', 'text analysis'],
  'google cloud platform': ['cloud computing', 'gcp'],
  'amazon web services': ['cloud computing', 'aws'],
  devops: ['docker', 'kubernetes', 'ci/cd', 'linux'],
};

/**
 * Synonym groups — all skills in a group are treated as equivalent for matching.
 * Any candidate skills from the same group satisfies a required skill in that group.
 */
export const SKILL_SYNONYM_GROUPS: string[][] = [
  // CRM / customer platforms
  ['crm', 'salesforce', 'hubspot', 'zendesk', 'dynamics 365', 'customer relationship management', 'pipedrive', 'intercom'],
  // Customer success / support
  ['customer success', 'customer support', 'account management', 'client success', 'customer service', 'client management'],
  // SaaS
  ['saas', 'software as a service', 'cloud software', 'cloud platform'],
  // B2B
  ['b2b', 'enterprise sales', 'business development', 'enterprise accounts', 'partner management'],
  // B2C
  ['b2c', 'consumer marketing', 'direct to consumer', 'd2c'],
  // Problem solving / analytical
  ['problem solving', 'data structures and algorithms', 'dsa', 'analytical thinking', 'critical thinking', 'algorithms'],
  // Project management
  ['project management', 'agile', 'scrum', 'kanban', 'product management'],
  // Communication
  ['communication', 'presentation skills', 'public speaking', 'stakeholder management'],
  // AI / ML cluster
  ['ml', 'machine learning', 'deep learning', 'dl', 'artificial intelligence', 'ai'],
  // NLP cluster
  ['nlp', 'natural language processing', 'text analysis', 'language model', 'llm', 'generative ai'],
  // Data analysis cluster
  ['data analysis', 'data science', 'analytics', 'business intelligence', 'tableau', 'power bi', 'excel', 'statistics'],
  // Cloud cluster
  ['cloud computing', 'amazon web services', 'google cloud platform', 'azure', 'gcp', 'aws', 'heroku', 'vercel', 'netlify'],
  // Database cluster
  ['database', 'sql', 'mysql', 'postgresql', 'mongodb', 'sqlite', 'firebase'],
  // Version control
  ['git', 'github', 'version control', 'gitlab'],
  // Leadership
  ['leadership', 'team management', 'people management', 'mentoring'],
  // Onboarding
  ['onboarding', 'customer success', 'product adoption', 'training'],
];

// Pre-build a lookup: normalised skill → Set of its synonyms (including itself)
const _synonymLookup = new Map<string, Set<string>>();
for (const group of SKILL_SYNONYM_GROUPS) {
  const normGroup = group.map(s => s.toLowerCase().trim());
  const groupSet = new Set(normGroup);
  for (const skill of normGroup) {
    const existing = _synonymLookup.get(skill);
    if (existing) {
      groupSet.forEach(s => existing.add(s));
    } else {
      _synonymLookup.set(skill, new Set(groupSet));
    }
  }
}
export const SYNONYM_LOOKUP = _synonymLookup;

/**
 * Normalizes a single skill string:
 *  1. Lowercase + trim
 *  2. Resolve alias
 */
export function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] ?? lower;
}

/**
 * Normalizes an array of skills and deduplicates.
 */
export function normalizeSkills(skills: string[]): string[] {
  return [...new Set(skills.map(normalizeSkill).filter(Boolean))];
}
