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
  'jquery': 'jquery',

  // Python
  py: 'python',
  'python3': 'python',

  // CSS
  'tailwind css': 'tailwindcss',
  'tailwind': 'tailwindcss',
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
  'hf': 'huggingface',

  // Misc
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
  'react native': 'react-native',
  ios: 'ios',
  android: 'android',

  // Testing
  jest: 'jest',
  mocha: 'mocha',
  cypress: 'cypress',
  selenium: 'selenium',
};

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
