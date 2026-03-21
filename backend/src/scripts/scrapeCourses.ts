/**
 * scrapeCourses.ts
 *
 * Two-phase course ingestion:
 *   Phase 1 – Inserts/upserts a comprehensive curated list (~130 real courses)
 *   Phase 2 – Calls the Coursera public REST API (no auth required) to discover
 *              additional courses for any skill that has fewer than 2 DB entries.
 *
 * Run: npm run scrape:courses
 */

import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { CourseModel, ICourse } from '../models/Course';
import { JobModel } from '../models/Job';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

type SkillCategory = ICourse['skillCategory'];
type Level = ICourse['level'];

interface CourseData {
  title: string;
  skill: string;
  skillCategory: SkillCategory;
  prerequisites: string[];
  estimatedHours: number;
  level: Level;
  resourceUrl: string;
  provider: string;
  tags: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, SkillCategory> = {
  // Languages
  python: 'language', javascript: 'language', typescript: 'language',
  java: 'language', 'c++': 'language', 'c#': 'language', go: 'language',
  golang: 'language', rust: 'language', swift: 'language', kotlin: 'language',
  ruby: 'language', php: 'language', scala: 'language', r: 'language',
  dart: 'language', elixir: 'language', perl: 'language',
  // Frameworks
  react: 'framework', angular: 'framework', vue: 'framework', nextjs: 'framework',
  'next.js': 'framework', svelte: 'framework', django: 'framework', flask: 'framework',
  fastapi: 'framework', 'spring boot': 'framework', express: 'framework',
  'node.js': 'framework', nodejs: 'framework', nestjs: 'framework', laravel: 'framework',
  rails: 'framework', 'ruby on rails': 'framework', nuxt: 'framework',
  // Databases
  sql: 'database', mysql: 'database', postgresql: 'database', mongodb: 'database',
  redis: 'database', elasticsearch: 'database', cassandra: 'database',
  dynamodb: 'database', firebase: 'database', sqlite: 'database',
  neo4j: 'database', 'oracle database': 'database',
  // Cloud
  aws: 'cloud', azure: 'cloud', gcp: 'cloud', 'google cloud': 'cloud',
  'google cloud platform': 'cloud', cloudflare: 'cloud',
  // AI / ML
  'machine learning': 'ai_ml', 'deep learning': 'ai_ml', tensorflow: 'ai_ml',
  pytorch: 'ai_ml', 'data science': 'ai_ml', 'natural language processing': 'ai_ml',
  nlp: 'ai_ml', 'computer vision': 'ai_ml', llm: 'ai_ml', 'generative ai': 'ai_ml',
  langchain: 'ai_ml', 'data analysis': 'ai_ml', pandas: 'ai_ml', numpy: 'ai_ml',
  'scikit-learn': 'ai_ml', 'neural networks': 'ai_ml', 'reinforcement learning': 'ai_ml',
  // Tools
  docker: 'tool', kubernetes: 'tool', git: 'tool', jenkins: 'tool',
  'ci/cd': 'tool', terraform: 'tool', linux: 'tool', bash: 'tool',
  graphql: 'tool', 'rest api': 'tool', microservices: 'tool', kafka: 'tool',
  prometheus: 'tool', grafana: 'tool', ansible: 'tool', nginx: 'tool',
  // Soft skills
  communication: 'soft_skill', leadership: 'soft_skill', 'project management': 'soft_skill',
  agile: 'soft_skill', scrum: 'soft_skill', 'problem solving': 'soft_skill',
  'critical thinking': 'soft_skill', 'time management': 'soft_skill',
};

const PREREQ_MAP: Record<string, string[]> = {
  typescript: ['javascript'],
  react: ['javascript'],
  angular: ['typescript'],
  vue: ['javascript'],
  nextjs: ['react'],
  nestjs: ['nodejs', 'typescript'],
  django: ['python'],
  flask: ['python'],
  fastapi: ['python'],
  'spring boot': ['java'],
  laravel: ['php'],
  rails: ['ruby'],
  kubernetes: ['docker'],
  terraform: ['aws'],
  tensorflow: ['python'],
  pytorch: ['python'],
  pandas: ['python'],
  'machine learning': ['python'],
  'deep learning': ['machine learning'],
  langchain: ['python'],
  postgresql: ['sql'],
  mysql: ['sql'],
};

function guessCategory(skill: string): SkillCategory {
  return CATEGORY_MAP[skill.toLowerCase()] ?? 'other';
}

function prereqs(skill: string): string[] {
  return PREREQ_MAP[skill.toLowerCase()] ?? [];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseWorkloadHours(workload: string | undefined): number {
  if (!workload) return 10;
  // "3-5 hours/week" or "1-3 hours / week"
  const range = workload.match(/(\d+)\s*-\s*(\d+)\s*hours?/i);
  if (range) {
    const avg = (parseInt(range[1]) + parseInt(range[2])) / 2;
    return Math.round(avg * 4); // assume ~4 weeks
  }
  const single = workload.match(/(\d+)\s*hours?/i);
  if (single) return parseInt(single[1]) * 4;
  return 10;
}

function detectLevel(title: string, desc = ''): Level {
  const text = `${title} ${desc}`.toLowerCase();
  if (/(advanced|expert|senior|master|professional|optimization|architecture)/i.test(text)) return 'advanced';
  if (/(beginner|introduction|intro|fundamentals|basics|getting started|zero to|no experience|for everyone|everyone)/i.test(text)) return 'beginner';
  return 'intermediate';
}

// ─── Phase 1 — Curated courses ────────────────────────────────────────────────

const CURATED: CourseData[] = [
  // ── Python ──────────────────────────────────────────────────────────────
  {
    title: 'Python for Everybody Specialization',
    skill: 'python', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 28,
    resourceUrl: 'https://www.coursera.org/specializations/python',
    provider: 'Coursera — University of Michigan',
    tags: ['python', 'programming', 'data'],
  },
  {
    title: 'Automate the Boring Stuff with Python',
    skill: 'python', skillCategory: 'language', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 20,
    resourceUrl: 'https://automatetheboringstuff.com/',
    provider: 'Free (automatetheboringstuff.com)',
    tags: ['python', 'automation', 'scripting'],
  },
  {
    title: 'Scientific Computing with Python',
    skill: 'python', skillCategory: 'language', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 40,
    resourceUrl: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
    provider: 'freeCodeCamp',
    tags: ['python', 'scientific', 'algorithms'],
  },

  // ── JavaScript ──────────────────────────────────────────────────────────
  {
    title: 'JavaScript Algorithms and Data Structures',
    skill: 'javascript', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 40,
    resourceUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
    provider: 'freeCodeCamp',
    tags: ['javascript', 'algorithms', 'data structures'],
  },
  {
    title: 'The Complete JavaScript Course 2024',
    skill: 'javascript', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 69,
    resourceUrl: 'https://www.udemy.com/course/the-complete-javascript-course/',
    provider: 'Udemy',
    tags: ['javascript', 'es6', 'web'],
  },
  {
    title: 'JavaScript: Understanding the Weird Parts',
    skill: 'javascript', skillCategory: 'language', level: 'advanced',
    prerequisites: ['javascript'], estimatedHours: 12,
    resourceUrl: 'https://www.udemy.com/course/understand-javascript/',
    provider: 'Udemy',
    tags: ['javascript', 'advanced', 'closures', 'prototype'],
  },

  // ── TypeScript ──────────────────────────────────────────────────────────
  {
    title: 'TypeScript: The Complete Developer Guide',
    skill: 'typescript', skillCategory: 'language', level: 'intermediate',
    prerequisites: ['javascript'], estimatedHours: 27,
    resourceUrl: 'https://www.udemy.com/course/typescript-the-complete-developers-guide/',
    provider: 'Udemy',
    tags: ['typescript', 'javascript', 'types'],
  },
  {
    title: 'Understanding TypeScript',
    skill: 'typescript', skillCategory: 'language', level: 'beginner',
    prerequisites: ['javascript'], estimatedHours: 15,
    resourceUrl: 'https://www.udemy.com/course/understanding-typescript/',
    provider: 'Udemy',
    tags: ['typescript', 'javascript'],
  },

  // ── Java ────────────────────────────────────────────────────────────────
  {
    title: 'Java Programming Masterclass for Software Developers',
    skill: 'java', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 80,
    resourceUrl: 'https://www.udemy.com/course/java-the-complete-java-developer-course/',
    provider: 'Udemy',
    tags: ['java', 'oop', 'jvm'],
  },
  {
    title: 'Object Oriented Programming in Java',
    skill: 'java', skillCategory: 'language', level: 'intermediate',
    prerequisites: ['java'], estimatedHours: 20,
    resourceUrl: 'https://www.coursera.org/specializations/object-oriented-programming',
    provider: 'Coursera — Duke University',
    tags: ['java', 'oop', 'design patterns'],
  },

  // ── Go ──────────────────────────────────────────────────────────────────
  {
    title: 'Go: The Complete Developer Guide',
    skill: 'go', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 22,
    resourceUrl: 'https://www.udemy.com/course/go-the-complete-developers-guide/',
    provider: 'Udemy',
    tags: ['golang', 'go', 'concurrency'],
  },
  {
    title: 'Learn Go Programming — Tour of Go',
    skill: 'go', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 8,
    resourceUrl: 'https://go.dev/tour/welcome/1',
    provider: 'Go Official Docs',
    tags: ['golang', 'go'],
  },

  // ── Rust ────────────────────────────────────────────────────────────────
  {
    title: 'The Rust Programming Language (The Book)',
    skill: 'rust', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 30,
    resourceUrl: 'https://doc.rust-lang.org/book/',
    provider: 'Rust Official Docs',
    tags: ['rust', 'systems', 'memory safety'],
  },
  {
    title: 'Rust Programming for Beginners',
    skill: 'rust', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 10,
    resourceUrl: 'https://www.udemy.com/course/rust-programming-the-complete-guide/',
    provider: 'Udemy',
    tags: ['rust', 'programming'],
  },

  // ── Kotlin ──────────────────────────────────────────────────────────────
  {
    title: 'Kotlin for Java Developers',
    skill: 'kotlin', skillCategory: 'language', level: 'intermediate',
    prerequisites: ['java'], estimatedHours: 15,
    resourceUrl: 'https://www.coursera.org/learn/kotlin-for-java-developers',
    provider: 'Coursera — JetBrains',
    tags: ['kotlin', 'android', 'jvm'],
  },

  // ── Swift ───────────────────────────────────────────────────────────────
  {
    title: 'iOS & Swift — The Complete iOS App Development Bootcamp',
    skill: 'swift', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 55,
    resourceUrl: 'https://www.udemy.com/course/ios-13-app-development-bootcamp/',
    provider: 'Udemy',
    tags: ['swift', 'ios', 'xcode', 'mobile'],
  },

  // ── C# ──────────────────────────────────────────────────────────────────
  {
    title: 'C# Fundamentals',
    skill: 'c#', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 10,
    resourceUrl: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/',
    provider: 'Microsoft Learn',
    tags: ['csharp', 'dotnet', '.net'],
  },
  {
    title: 'Complete C# Masterclass',
    skill: 'c#', skillCategory: 'language', level: 'intermediate',
    prerequisites: [], estimatedHours: 35,
    resourceUrl: 'https://www.udemy.com/course/complete-csharp-masterclass/',
    provider: 'Udemy',
    tags: ['csharp', 'dotnet', 'oop'],
  },

  // ── PHP ─────────────────────────────────────────────────────────────────
  {
    title: 'PHP for Beginners — Become a PHP Master',
    skill: 'php', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 24,
    resourceUrl: 'https://www.udemy.com/course/php-for-complete-beginners-includes-msql-and-oop/',
    provider: 'Udemy',
    tags: ['php', 'web', 'server-side'],
  },

  // ── R ───────────────────────────────────────────────────────────────────
  {
    title: 'R Programming',
    skill: 'r', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 8,
    resourceUrl: 'https://www.coursera.org/learn/r-programming',
    provider: 'Coursera — Johns Hopkins',
    tags: ['r', 'statistics', 'data analysis'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FRAMEWORKS
  // ══════════════════════════════════════════════════════════════════════════

  // ── React ───────────────────────────────────────────────────────────────
  {
    title: 'Front End Development Libraries',
    skill: 'react', skillCategory: 'framework', level: 'beginner',
    prerequisites: ['javascript'], estimatedHours: 40,
    resourceUrl: 'https://www.freecodecamp.org/learn/front-end-development-libraries/',
    provider: 'freeCodeCamp',
    tags: ['react', 'redux', 'javascript', 'frontend'],
  },
  {
    title: 'React — The Complete Guide (Hooks, Router, Redux)',
    skill: 'react', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['javascript'], estimatedHours: 48,
    resourceUrl: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
    provider: 'Udemy',
    tags: ['react', 'hooks', 'redux', 'jsx'],
  },
  {
    title: 'Epic React by Kent C. Dodds',
    skill: 'react', skillCategory: 'framework', level: 'advanced',
    prerequisites: ['react', 'javascript'], estimatedHours: 30,
    resourceUrl: 'https://epicreact.dev/',
    provider: 'epicreact.dev',
    tags: ['react', 'advanced', 'performance', 'patterns'],
  },

  // ── Next.js ─────────────────────────────────────────────────────────────
  {
    title: 'Next.js & React — The Complete Guide',
    skill: 'nextjs', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['react', 'javascript'], estimatedHours: 25,
    resourceUrl: 'https://www.udemy.com/course/nextjs-react-the-complete-guide/',
    provider: 'Udemy',
    tags: ['nextjs', 'react', 'ssr', 'fullstack'],
  },
  {
    title: 'Next.js Official Learn Course',
    skill: 'nextjs', skillCategory: 'framework', level: 'beginner',
    prerequisites: ['react'], estimatedHours: 12,
    resourceUrl: 'https://nextjs.org/learn',
    provider: 'Next.js Official Docs',
    tags: ['nextjs', 'react', 'server-components'],
  },

  // ── Vue ─────────────────────────────────────────────────────────────────
  {
    title: 'Vue — The Complete Guide (incl. Router & Composition API)',
    skill: 'vue', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['javascript'], estimatedHours: 32,
    resourceUrl: 'https://www.udemy.com/course/vuejs-2-the-complete-guide/',
    provider: 'Udemy',
    tags: ['vue', 'javascript', 'frontend', 'vuex'],
  },

  // ── Angular ─────────────────────────────────────────────────────────────
  {
    title: 'Angular — The Complete Guide',
    skill: 'angular', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['typescript', 'javascript'], estimatedHours: 37,
    resourceUrl: 'https://www.udemy.com/course/the-complete-guide-to-angular-2/',
    provider: 'Udemy',
    tags: ['angular', 'typescript', 'rxjs', 'frontend'],
  },

  // ── Node.js / Express ───────────────────────────────────────────────────
  {
    title: "Back End Development and APIs",
    skill: 'nodejs', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['javascript'], estimatedHours: 40,
    resourceUrl: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/',
    provider: 'freeCodeCamp',
    tags: ['nodejs', 'express', 'api', 'backend'],
  },
  {
    title: 'Node.js — The Complete Guide (MVC, REST APIs, GraphQL)',
    skill: 'nodejs', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['javascript'], estimatedHours: 40,
    resourceUrl: 'https://www.udemy.com/course/nodejs-the-complete-guide/',
    provider: 'Udemy',
    tags: ['nodejs', 'express', 'mvc', 'rest'],
  },

  // ── Django ──────────────────────────────────────────────────────────────
  {
    title: 'Django for Everybody Specialization',
    skill: 'django', skillCategory: 'framework', level: 'beginner',
    prerequisites: ['python'], estimatedHours: 16,
    resourceUrl: 'https://www.coursera.org/specializations/django',
    provider: 'Coursera — University of Michigan',
    tags: ['django', 'python', 'web', 'backend'],
  },
  {
    title: 'Python Django — The Practical Guide',
    skill: 'django', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 23,
    resourceUrl: 'https://www.udemy.com/course/python-django-the-practical-guide/',
    provider: 'Udemy',
    tags: ['django', 'python', 'rest', 'fullstack'],
  },

  // ── Flask ───────────────────────────────────────────────────────────────
  {
    title: 'REST APIs with Flask and Python',
    skill: 'flask', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 17,
    resourceUrl: 'https://www.udemy.com/course/rest-api-flask-and-python/',
    provider: 'Udemy',
    tags: ['flask', 'python', 'rest', 'api'],
  },

  // ── FastAPI ─────────────────────────────────────────────────────────────
  {
    title: 'FastAPI — The Complete Course',
    skill: 'fastapi', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 14,
    resourceUrl: 'https://www.udemy.com/course/fastapi-the-complete-course/',
    provider: 'Udemy',
    tags: ['fastapi', 'python', 'api', 'pydantic'],
  },
  {
    title: 'FastAPI Official Tutorial',
    skill: 'fastapi', skillCategory: 'framework', level: 'beginner',
    prerequisites: ['python'], estimatedHours: 8,
    resourceUrl: 'https://fastapi.tiangolo.com/tutorial/',
    provider: 'FastAPI Official Docs',
    tags: ['fastapi', 'python', 'async'],
  },

  // ── Spring Boot ─────────────────────────────────────────────────────────
  {
    title: 'Spring & Hibernate for Beginners (includes Spring Boot)',
    skill: 'spring boot', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['java'], estimatedHours: 41,
    resourceUrl: 'https://www.udemy.com/course/spring-hibernate-tutorial/',
    provider: 'Udemy',
    tags: ['spring', 'java', 'hibernate', 'rest'],
  },

  // ── NestJS ──────────────────────────────────────────────────────────────
  {
    title: 'NestJS Complete Developer Guide',
    skill: 'nestjs', skillCategory: 'framework', level: 'intermediate',
    prerequisites: ['typescript', 'nodejs'], estimatedHours: 24,
    resourceUrl: 'https://www.udemy.com/course/nestjs-the-complete-developers-guide/',
    provider: 'Udemy',
    tags: ['nestjs', 'typescript', 'api', 'backend'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DATABASES
  // ══════════════════════════════════════════════════════════════════════════

  // ── SQL ─────────────────────────────────────────────────────────────────
  {
    title: 'Relational Database Certification',
    skill: 'sql', skillCategory: 'database', level: 'beginner',
    prerequisites: [], estimatedHours: 40,
    resourceUrl: 'https://www.freecodecamp.org/learn/relational-database/',
    provider: 'freeCodeCamp',
    tags: ['sql', 'postgresql', 'bash', 'database'],
  },
  {
    title: 'The Complete SQL Bootcamp',
    skill: 'sql', skillCategory: 'database', level: 'beginner',
    prerequisites: [], estimatedHours: 9,
    resourceUrl: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
    provider: 'Udemy',
    tags: ['sql', 'postgresql', 'queries'],
  },
  {
    title: 'Advanced SQL for Query Tuning and Performance Optimization',
    skill: 'sql', skillCategory: 'database', level: 'advanced',
    prerequisites: ['sql'], estimatedHours: 6,
    resourceUrl: 'https://www.coursera.org/learn/advanced-sql-for-query-tuning-and-performance-optimization',
    provider: 'Coursera',
    tags: ['sql', 'performance', 'query optimization'],
  },

  // ── PostgreSQL ──────────────────────────────────────────────────────────
  {
    title: 'PostgreSQL for Everybody Specialization',
    skill: 'postgresql', skillCategory: 'database', level: 'beginner',
    prerequisites: ['sql'], estimatedHours: 16,
    resourceUrl: 'https://www.coursera.org/specializations/postgresql-for-everybody',
    provider: 'Coursera — University of Michigan',
    tags: ['postgresql', 'sql', 'database'],
  },

  // ── MongoDB ─────────────────────────────────────────────────────────────
  {
    title: 'MongoDB — The Complete Developer Guide',
    skill: 'mongodb', skillCategory: 'database', level: 'beginner',
    prerequisites: [], estimatedHours: 17,
    resourceUrl: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/',
    provider: 'Udemy',
    tags: ['mongodb', 'nosql', 'database', 'aggregation'],
  },
  {
    title: 'MongoDB University Free Courses',
    skill: 'mongodb', skillCategory: 'database', level: 'intermediate',
    prerequisites: [], estimatedHours: 20,
    resourceUrl: 'https://learn.mongodb.com/catalog',
    provider: 'MongoDB University',
    tags: ['mongodb', 'nosql', 'atlas', 'aggregation'],
  },

  // ── Redis ───────────────────────────────────────────────────────────────
  {
    title: 'Redis Bootcamp — Complete Developer Guide',
    skill: 'redis', skillCategory: 'database', level: 'intermediate',
    prerequisites: [], estimatedHours: 8,
    resourceUrl: 'https://www.udemy.com/course/redis-bootcamp-for-beginners/',
    provider: 'Udemy',
    tags: ['redis', 'cache', 'pub/sub', 'data structures'],
  },

  // ── Elasticsearch ───────────────────────────────────────────────────────
  {
    title: 'Elasticsearch 8 and the Elastic Stack',
    skill: 'elasticsearch', skillCategory: 'database', level: 'intermediate',
    prerequisites: [], estimatedHours: 12,
    resourceUrl: 'https://www.udemy.com/course/elasticsearch/',
    provider: 'Udemy',
    tags: ['elasticsearch', 'kibana', 'search', 'analytics'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CLOUD
  // ══════════════════════════════════════════════════════════════════════════

  // ── AWS ─────────────────────────────────────────────────────────────────
  {
    title: 'AWS Cloud Practitioner Essentials',
    skill: 'aws', skillCategory: 'cloud', level: 'beginner',
    prerequisites: [], estimatedHours: 6,
    resourceUrl: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/',
    provider: 'AWS Training',
    tags: ['aws', 'cloud', 'certification'],
  },
  {
    title: 'Ultimate AWS Certified Developer Associate',
    skill: 'aws', skillCategory: 'cloud', level: 'intermediate',
    prerequisites: [], estimatedHours: 29,
    resourceUrl: 'https://www.udemy.com/course/aws-certified-developer-associate-dva-c01/',
    provider: 'Udemy',
    tags: ['aws', 'lambda', 's3', 'dynamodb', 'certification'],
  },
  {
    title: 'AWS Solutions Architect Professional',
    skill: 'aws', skillCategory: 'cloud', level: 'advanced',
    prerequisites: ['aws'], estimatedHours: 26,
    resourceUrl: 'https://www.udemy.com/course/aws-solutions-architect-professional/',
    provider: 'Udemy',
    tags: ['aws', 'architecture', 'certification', 'advanced'],
  },

  // ── Azure ───────────────────────────────────────────────────────────────
  {
    title: 'Azure Fundamentals (AZ-900)',
    skill: 'azure', skillCategory: 'cloud', level: 'beginner',
    prerequisites: [], estimatedHours: 10,
    resourceUrl: 'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/',
    provider: 'Microsoft Learn',
    tags: ['azure', 'cloud', 'az-900', 'certification'],
  },
  {
    title: 'AZ-204: Developing Solutions for Microsoft Azure',
    skill: 'azure', skillCategory: 'cloud', level: 'intermediate',
    prerequisites: ['azure'], estimatedHours: 22,
    resourceUrl: 'https://learn.microsoft.com/en-us/training/courses/az-204t00',
    provider: 'Microsoft Learn',
    tags: ['azure', 'developer', 'az-204', 'certification'],
  },

  // ── GCP ─────────────────────────────────────────────────────────────────
  {
    title: 'Google Cloud Fundamentals: Core Infrastructure',
    skill: 'gcp', skillCategory: 'cloud', level: 'beginner',
    prerequisites: [], estimatedHours: 8,
    resourceUrl: 'https://www.coursera.org/learn/gcp-fundamentals',
    provider: 'Coursera — Google Cloud',
    tags: ['gcp', 'cloud', 'google cloud'],
  },
  {
    title: 'Architecting with Google Compute Engine',
    skill: 'gcp', skillCategory: 'cloud', level: 'intermediate',
    prerequisites: ['gcp'], estimatedHours: 20,
    resourceUrl: 'https://www.coursera.org/specializations/gcp-architecture',
    provider: 'Coursera — Google Cloud',
    tags: ['gcp', 'compute', 'networking', 'storage'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AI / ML
  // ══════════════════════════════════════════════════════════════════════════

  // ── Machine Learning ────────────────────────────────────────────────────
  {
    title: 'Machine Learning Specialization',
    skill: 'machine learning', skillCategory: 'ai_ml', level: 'beginner',
    prerequisites: ['python'], estimatedHours: 36,
    resourceUrl: 'https://www.coursera.org/specializations/machine-learning-introduction',
    provider: 'Coursera — DeepLearning.AI / Stanford',
    tags: ['machine learning', 'supervised learning', 'neural networks'],
  },
  {
    title: 'Machine Learning A-Z (Python & R)',
    skill: 'machine learning', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 44,
    resourceUrl: 'https://www.udemy.com/course/machinelearning/',
    provider: 'Udemy',
    tags: ['machine learning', 'python', 'sklearn'],
  },

  // ── Deep Learning ───────────────────────────────────────────────────────
  {
    title: 'Deep Learning Specialization',
    skill: 'deep learning', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['machine learning', 'python'], estimatedHours: 80,
    resourceUrl: 'https://www.coursera.org/specializations/deep-learning',
    provider: 'Coursera — DeepLearning.AI',
    tags: ['deep learning', 'neural networks', 'cnn', 'rnn'],
  },
  {
    title: 'fast.ai Practical Deep Learning for Coders',
    skill: 'deep learning', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 50,
    resourceUrl: 'https://course.fast.ai/',
    provider: 'fast.ai',
    tags: ['deep learning', 'pytorch', 'computer vision', 'nlp'],
  },

  // ── TensorFlow ──────────────────────────────────────────────────────────
  {
    title: 'TensorFlow Developer Certificate Program',
    skill: 'tensorflow', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['python', 'machine learning'], estimatedHours: 16,
    resourceUrl: 'https://www.coursera.org/professional-certificates/tensorflow-in-practice',
    provider: 'Coursera — DeepLearning.AI',
    tags: ['tensorflow', 'keras', 'cnn', 'nlp'],
  },

  // ── PyTorch ─────────────────────────────────────────────────────────────
  {
    title: 'PyTorch for Deep Learning Bootcamp',
    skill: 'pytorch', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['python', 'machine learning'], estimatedHours: 26,
    resourceUrl: 'https://www.udemy.com/course/pytorch-for-deep-learning-with-python-bootcamp/',
    provider: 'Udemy',
    tags: ['pytorch', 'deep learning', 'neural networks'],
  },
  {
    title: 'PyTorch Official Tutorials',
    skill: 'pytorch', skillCategory: 'ai_ml', level: 'beginner',
    prerequisites: ['python'], estimatedHours: 10,
    resourceUrl: 'https://pytorch.org/tutorials/',
    provider: 'PyTorch Official Docs',
    tags: ['pytorch', 'tensors', 'autograd'],
  },

  // ── Data Science ────────────────────────────────────────────────────────
  {
    title: 'Data Analysis with Python',
    skill: 'data science', skillCategory: 'ai_ml', level: 'beginner',
    prerequisites: ['python'], estimatedHours: 40,
    resourceUrl: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
    provider: 'freeCodeCamp',
    tags: ['data science', 'pandas', 'numpy', 'jupyter'],
  },
  {
    title: 'IBM Data Science Professional Certificate',
    skill: 'data science', skillCategory: 'ai_ml', level: 'beginner',
    prerequisites: [], estimatedHours: 48,
    resourceUrl: 'https://www.coursera.org/professional-certificates/ibm-data-science',
    provider: 'Coursera — IBM',
    tags: ['data science', 'python', 'sql', 'machine learning'],
  },

  // ── NLP ─────────────────────────────────────────────────────────────────
  {
    title: 'Natural Language Processing Specialization',
    skill: 'nlp', skillCategory: 'ai_ml', level: 'advanced',
    prerequisites: ['deep learning', 'python'], estimatedHours: 64,
    resourceUrl: 'https://www.coursera.org/specializations/natural-language-processing',
    provider: 'Coursera — DeepLearning.AI',
    tags: ['nlp', 'transformers', 'attention', 'bert'],
  },

  // ── LLM / Generative AI ─────────────────────────────────────────────────
  {
    title: 'Generative AI with Large Language Models',
    skill: 'llm', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['machine learning', 'python'], estimatedHours: 16,
    resourceUrl: 'https://www.coursera.org/learn/generative-ai-with-llms',
    provider: 'Coursera — DeepLearning.AI / AWS',
    tags: ['llm', 'generative ai', 'fine-tuning', 'rlhf'],
  },
  {
    title: 'Prompt Engineering for Developers',
    skill: 'generative ai', skillCategory: 'ai_ml', level: 'beginner',
    prerequisites: ['python'], estimatedHours: 4,
    resourceUrl: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/',
    provider: 'DeepLearning.AI',
    tags: ['generative ai', 'chatgpt', 'prompting', 'openai'],
  },
  {
    title: 'LangChain for LLM Application Development',
    skill: 'langchain', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['python', 'llm'], estimatedHours: 6,
    resourceUrl: 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/',
    provider: 'DeepLearning.AI',
    tags: ['langchain', 'llm', 'rag', 'python'],
  },

  // ── Pandas ──────────────────────────────────────────────────────────────
  {
    title: 'Pandas for Data Analysis',
    skill: 'pandas', skillCategory: 'ai_ml', level: 'intermediate',
    prerequisites: ['python'], estimatedHours: 10,
    resourceUrl: 'https://www.kaggle.com/learn/pandas',
    provider: 'Kaggle Learn',
    tags: ['pandas', 'python', 'data analysis', 'dataframe'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOOLS / DEVOPS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Docker ──────────────────────────────────────────────────────────────
  {
    title: 'Docker and Kubernetes: The Complete Guide',
    skill: 'docker', skillCategory: 'tool', level: 'beginner',
    prerequisites: [], estimatedHours: 21,
    resourceUrl: 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/',
    provider: 'Udemy',
    tags: ['docker', 'kubernetes', 'containers', 'devops'],
  },
  {
    title: 'Docker Official Getting Started',
    skill: 'docker', skillCategory: 'tool', level: 'beginner',
    prerequisites: [], estimatedHours: 4,
    resourceUrl: 'https://docs.docker.com/get-started/',
    provider: 'Docker Official Docs',
    tags: ['docker', 'containers', 'images'],
  },

  // ── Kubernetes ──────────────────────────────────────────────────────────
  {
    title: 'Kubernetes for the Absolute Beginners',
    skill: 'kubernetes', skillCategory: 'tool', level: 'beginner',
    prerequisites: ['docker'], estimatedHours: 6,
    resourceUrl: 'https://www.udemy.com/course/learn-kubernetes/',
    provider: 'Udemy',
    tags: ['kubernetes', 'k8s', 'orchestration', 'pods'],
  },
  {
    title: 'Certified Kubernetes Administrator (CKA) with Practice Tests',
    skill: 'kubernetes', skillCategory: 'tool', level: 'advanced',
    prerequisites: ['docker', 'kubernetes'], estimatedHours: 17,
    resourceUrl: 'https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/',
    provider: 'Udemy',
    tags: ['kubernetes', 'cka', 'certification', 'networking'],
  },

  // ── Git ─────────────────────────────────────────────────────────────────
  {
    title: 'Git & GitHub — The Practical Guide',
    skill: 'git', skillCategory: 'tool', level: 'beginner',
    prerequisites: [], estimatedHours: 6,
    resourceUrl: 'https://www.udemy.com/course/git-github-practical-guide/',
    provider: 'Udemy',
    tags: ['git', 'github', 'version control', 'branching'],
  },
  {
    title: 'Pro Git — Free Book',
    skill: 'git', skillCategory: 'tool', level: 'intermediate',
    prerequisites: ['git'], estimatedHours: 8,
    resourceUrl: 'https://git-scm.com/book/en/v2',
    provider: 'Git Official Docs',
    tags: ['git', 'internals', 'advanced git'],
  },

  // ── Terraform ───────────────────────────────────────────────────────────
  {
    title: 'HashiCorp Certified: Terraform Associate',
    skill: 'terraform', skillCategory: 'tool', level: 'intermediate',
    prerequisites: [], estimatedHours: 10,
    resourceUrl: 'https://www.udemy.com/course/terraform-associate-practice-exam/',
    provider: 'Udemy',
    tags: ['terraform', 'iac', 'infrastructure', 'hashicorp'],
  },

  // ── CI/CD ───────────────────────────────────────────────────────────────
  {
    title: 'DevOps Beginners to Advanced — CI/CD Pipelines',
    skill: 'ci/cd', skillCategory: 'tool', level: 'beginner',
    prerequisites: ['git', 'docker'], estimatedHours: 20,
    resourceUrl: 'https://www.udemy.com/course/valaxy-devops/',
    provider: 'Udemy',
    tags: ['ci/cd', 'jenkins', 'github actions', 'devops'],
  },

  // ── Linux ───────────────────────────────────────────────────────────────
  {
    title: 'Linux for Beginners',
    skill: 'linux', skillCategory: 'tool', level: 'beginner',
    prerequisites: [], estimatedHours: 7,
    resourceUrl: 'https://www.udemy.com/course/linux-mastery/',
    provider: 'Udemy',
    tags: ['linux', 'bash', 'shell', 'command line'],
  },

  // ── GraphQL ─────────────────────────────────────────────────────────────
  {
    title: 'GraphQL by Example',
    skill: 'graphql', skillCategory: 'tool', level: 'intermediate',
    prerequisites: ['javascript', 'nodejs'], estimatedHours: 8,
    resourceUrl: 'https://www.udemy.com/course/graphql-by-example/',
    provider: 'Udemy',
    tags: ['graphql', 'apollo', 'api', 'schema'],
  },

  // ── Microservices ───────────────────────────────────────────────────────
  {
    title: 'Microservices with Node JS and React',
    skill: 'microservices', skillCategory: 'tool', level: 'advanced',
    prerequisites: ['nodejs', 'docker', 'kubernetes'], estimatedHours: 54,
    resourceUrl: 'https://www.udemy.com/course/microservices-with-node-js-and-react/',
    provider: 'Udemy',
    tags: ['microservices', 'nodejs', 'kubernetes', 'event-driven'],
  },

  // ── System Design ───────────────────────────────────────────────────────
  {
    title: 'Grokking System Design Interview',
    skill: 'system design', skillCategory: 'tool', level: 'advanced',
    prerequisites: [], estimatedHours: 30,
    resourceUrl: 'https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers',
    provider: 'Educative',
    tags: ['system design', 'scalability', 'architecture', 'interviews'],
  },

  // ── REST API ────────────────────────────────────────────────────────────
  {
    title: 'APIs and Microservices Certification',
    skill: 'rest api', skillCategory: 'tool', level: 'beginner',
    prerequisites: ['javascript', 'nodejs'], estimatedHours: 40,
    resourceUrl: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/',
    provider: 'freeCodeCamp',
    tags: ['rest', 'api', 'json', 'express'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOFT SKILLS
  // ══════════════════════════════════════════════════════════════════════════
  {
    title: 'Agile Development Specialization',
    skill: 'agile', skillCategory: 'soft_skill', level: 'beginner',
    prerequisites: [], estimatedHours: 24,
    resourceUrl: 'https://www.coursera.org/specializations/agile-development',
    provider: 'Coursera — University of Virginia',
    tags: ['agile', 'scrum', 'kanban', 'retrospectives'],
  },
  {
    title: 'Scrum Master Certification Prep',
    skill: 'scrum', skillCategory: 'soft_skill', level: 'beginner',
    prerequisites: [], estimatedHours: 6,
    resourceUrl: 'https://www.udemy.com/course/agile-scrum-get-certified-as-professional-scrum-master-i/',
    provider: 'Udemy',
    tags: ['scrum', 'agile', 'sprint', 'psm'],
  },
  {
    title: 'Project Management Professional (PMP) Certification',
    skill: 'project management', skillCategory: 'soft_skill', level: 'intermediate',
    prerequisites: [], estimatedHours: 25,
    resourceUrl: 'https://www.udemy.com/course/project-management-professional/',
    provider: 'Udemy',
    tags: ['project management', 'pmp', 'waterfall', 'stakeholders'],
  },
  {
    title: 'Communication Skills — Improve Your Communication',
    skill: 'communication', skillCategory: 'soft_skill', level: 'beginner',
    prerequisites: [], estimatedHours: 3,
    resourceUrl: 'https://www.udemy.com/course/the-complete-communication-skills-master-class-for-life/',
    provider: 'Udemy',
    tags: ['communication', 'presentation', 'writing'],
  },
  {
    title: 'Developing Leadership Skills',
    skill: 'leadership', skillCategory: 'soft_skill', level: 'intermediate',
    prerequisites: [], estimatedHours: 8,
    resourceUrl: 'https://www.coursera.org/specializations/leading-teams',
    provider: 'Coursera — University of Michigan',
    tags: ['leadership', 'management', 'team building'],
  },

  // ── Full-Stack Web Bootcamp ──────────────────────────────────────────────
  {
    title: 'Full Stack Open — Deep Dive Into Modern Web Development',
    skill: 'javascript', skillCategory: 'language', level: 'advanced',
    prerequisites: ['javascript', 'react', 'nodejs'], estimatedHours: 200,
    resourceUrl: 'https://fullstackopen.com/',
    provider: 'University of Helsinki (Free)',
    tags: ['javascript', 'react', 'nodejs', 'typescript', 'graphql', 'testing'],
  },
  {
    title: 'The Odin Project — Full Stack JavaScript Path',
    skill: 'javascript', skillCategory: 'language', level: 'intermediate',
    prerequisites: ['javascript'], estimatedHours: 100,
    resourceUrl: 'https://www.theodinproject.com/paths/full-stack-javascript',
    provider: 'The Odin Project (Free)',
    tags: ['javascript', 'react', 'nodejs', 'fullstack'],
  },
  {
    title: 'CS50: Introduction to Computer Science',
    skill: 'python', skillCategory: 'language', level: 'beginner',
    prerequisites: [], estimatedHours: 100,
    resourceUrl: 'https://cs50.harvard.edu/x/',
    provider: 'Harvard (edX / Free audit)',
    tags: ['python', 'c', 'algorithms', 'web', 'cs fundamentals'],
  },
];

// ─── Phase 2 — Coursera API scraper ──────────────────────────────────────────

interface CourseraElement {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  workload?: string;
}

async function fetchCourseraForSkill(skill: string): Promise<CourseData[]> {
  try {
    const url =
      `https://api.coursera.org/api/courses.v1?q=search` +
      `&query=${encodeURIComponent(skill)}` +
      `&fields=name,slug,shortDescription,workload` +
      `&limit=3`;

    const res = await axios.get<{ elements: CourseraElement[] }>(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CourseScraperBot/1.0)' },
    });

    return (res.data.elements ?? []).map((el): CourseData => {
      const title = el.name;
      const resourceUrl = `https://www.coursera.org/learn/${el.slug}`;
      const level = detectLevel(title, el.shortDescription);
      const hours = parseWorkloadHours(el.workload);
      return {
        title,
        skill: skill.toLowerCase(),
        skillCategory: guessCategory(skill),
        prerequisites: prereqs(skill),
        estimatedHours: hours,
        level,
        resourceUrl,
        provider: 'Coursera',
        tags: [skill.toLowerCase()],
      };
    });
  } catch {
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) throw new Error('MONGODB_URI not set in .env');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  logger.info('Connected to MongoDB');

  // ── Phase 1: insert curated courses ──────────────────────────────────────
  let inserted = 0;
  let skipped = 0;
  for (const course of CURATED) {
    const result = await CourseModel.updateOne(
      { resourceUrl: course.resourceUrl },
      { $setOnInsert: { ...course } },
      { upsert: true }
    );
    if (result.upsertedCount > 0) inserted++;
    else skipped++;
  }
  logger.info(`Phase 1 complete — inserted: ${inserted}, already existed: ${skipped}`);

  // ── Phase 2: top-up with Coursera API ────────────────────────────────────
  // Determine which skills need more courses
  logger.info('Phase 2 — fetching skills from job collection...');

  // Unique skills from jobs (top 60 most mentioned)
  const jobSkills: string[] = await (JobModel as unknown as {
    aggregate(pipeline: object[]): Promise<{ _id: string; count: number }[]>;
  }).aggregate([
    { $unwind: '$requiredSkills' },
    { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 60 },
  ]).then((r) => r.map((x) => x._id.toLowerCase()));

  logger.info(`Found ${jobSkills.length} unique skills from job postings`);

  let apiInserted = 0;
  for (const skill of jobSkills) {
    // Check how many courses exist for this skill
    const existing = await CourseModel.countDocuments({ skill, isActive: true });
    if (existing >= 2) continue; // already covered

    logger.info(`  Fetching Coursera for skill: "${skill}"`);
    const courses = await fetchCourseraForSkill(skill);

    for (const c of courses) {
      const result = await CourseModel.updateOne(
        { resourceUrl: c.resourceUrl },
        { $setOnInsert: c },
        { upsert: true }
      );
      if (result.upsertedCount > 0) apiInserted++;
    }

    await sleep(800); // rate-limit: ~1 req/sec
  }

  logger.info(`Phase 2 complete — additional courses inserted via Coursera API: ${apiInserted}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = await CourseModel.countDocuments({ isActive: true });
  const byCategory = await CourseModel.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$skillCategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  logger.info(`\n✅ Scrape complete — ${total} active courses in DB`);
  logger.info('By category:');
  byCategory.forEach((row: { _id: string; count: number }) => {
    logger.info(`  ${row._id}: ${row.count}`);
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  logger.error('Scraper failed:', err);
  process.exit(1);
});
