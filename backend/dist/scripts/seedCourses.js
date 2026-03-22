"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const Course_1 = require("../models/Course");
const COURSES = [
    {
        title: 'The Complete JavaScript Course 2024',
        skill: 'javascript',
        skillCategory: 'language',
        prerequisites: [],
        estimatedHours: 69,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/the-complete-javascript-course/',
        provider: 'Udemy',
        tags: ['javascript', 'web', 'es6'],
    },
    {
        title: 'TypeScript: The Complete Developer Guide',
        skill: 'typescript',
        skillCategory: 'language',
        prerequisites: ['javascript'],
        estimatedHours: 27,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/typescript-the-complete-developers-guide/',
        provider: 'Udemy',
        tags: ['typescript', 'javascript'],
    },
    {
        title: 'Python for Everybody Specialization',
        skill: 'python',
        skillCategory: 'language',
        prerequisites: [],
        estimatedHours: 28,
        level: 'beginner',
        resourceUrl: 'https://www.coursera.org/specializations/python',
        provider: 'Coursera (University of Michigan)',
        tags: ['python', 'programming'],
    },
    {
        title: 'Java Programming Masterclass',
        skill: 'java',
        skillCategory: 'language',
        prerequisites: [],
        estimatedHours: 80,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/java-the-complete-java-developer-course/',
        provider: 'Udemy',
        tags: ['java', 'oop'],
    },
    {
        title: 'React - The Complete Guide (incl Hooks, React Router, Redux)',
        skill: 'react',
        skillCategory: 'framework',
        prerequisites: ['javascript'],
        estimatedHours: 48,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
        provider: 'Udemy',
        tags: ['react', 'javascript', 'frontend'],
    },
    {
        title: 'Next.js & React - The Complete Guide',
        skill: 'nextjs',
        skillCategory: 'framework',
        prerequisites: ['react', 'javascript'],
        estimatedHours: 25,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/nextjs-react-the-complete-guide/',
        provider: 'Udemy',
        tags: ['nextjs', 'react', 'ssr'],
    },
    {
        title: 'Angular - The Complete Guide',
        skill: 'angular',
        skillCategory: 'framework',
        prerequisites: ['typescript', 'javascript'],
        estimatedHours: 37,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/the-complete-guide-to-angular-2/',
        provider: 'Udemy',
        tags: ['angular', 'typescript', 'frontend'],
    },
    {
        title: 'Vue - The Complete Guide (incl. Router & Composition API)',
        skill: 'vue',
        skillCategory: 'framework',
        prerequisites: ['javascript'],
        estimatedHours: 32,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/vuejs-2-the-complete-guide/',
        provider: 'Udemy',
        tags: ['vue', 'javascript', 'frontend'],
    },
    {
        title: 'Node.js, Express, MongoDB & More: The Complete Bootcamp',
        skill: 'nodejs',
        skillCategory: 'framework',
        prerequisites: ['javascript'],
        estimatedHours: 42,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/',
        provider: 'Udemy',
        tags: ['nodejs', 'express', 'backend'],
    },
    {
        title: 'Flask & Python: Build REST APIs',
        skill: 'flask',
        skillCategory: 'framework',
        prerequisites: ['python'],
        estimatedHours: 20,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/rest-api-flask-and-python/',
        provider: 'Udemy',
        tags: ['flask', 'python', 'api'],
    },
    {
        title: 'Flutter & Dart - The Complete Guide',
        skill: 'flutter',
        skillCategory: 'framework',
        prerequisites: [],
        estimatedHours: 42,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/',
        provider: 'Udemy',
        tags: ['flutter', 'dart', 'mobile'],
    },
    {
        title: 'MongoDB - The Complete Developer Guide',
        skill: 'mongodb',
        skillCategory: 'database',
        prerequisites: [],
        estimatedHours: 17,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/',
        provider: 'Udemy',
        tags: ['mongodb', 'nosql', 'database'],
    },
    {
        title: 'The Complete SQL Bootcamp: Go from Zero to Hero',
        skill: 'sql',
        skillCategory: 'database',
        prerequisites: [],
        estimatedHours: 9,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
        provider: 'Udemy',
        tags: ['sql', 'database', 'postgresql'],
    },
    {
        title: 'Redis: The Complete Developer Guide',
        skill: 'redis',
        skillCategory: 'database',
        prerequisites: [],
        estimatedHours: 17,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/redis-the-complete-developers-guide-p/',
        provider: 'Udemy',
        tags: ['redis', 'caching', 'database'],
    },
    {
        title: 'Machine Learning Specialization',
        skill: 'ml',
        skillCategory: 'ai_ml',
        prerequisites: ['python'],
        estimatedHours: 95,
        level: 'intermediate',
        resourceUrl: 'https://www.coursera.org/specializations/machine-learning-introduction',
        provider: 'Coursera (Andrew Ng)',
        tags: ['machine learning', 'ai', 'supervised learning'],
    },
    {
        title: 'LangChain - Develop LLM Powered Applications',
        skill: 'langchain',
        skillCategory: 'ai_ml',
        prerequisites: ['python'],
        estimatedHours: 15,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/langchain/',
        provider: 'Udemy',
        tags: ['langchain', 'llm', 'generative ai'],
    },
    {
        title: 'ChatGPT & Generative AI: The Complete Guide',
        skill: 'generative ai',
        skillCategory: 'ai_ml',
        prerequisites: ['python'],
        estimatedHours: 12,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/complete-ai-guide/',
        provider: 'Udemy',
        tags: ['generative ai', 'openai', 'llm'],
    },
    {
        title: 'NLP with Python for Machine Learning',
        skill: 'nlp',
        skillCategory: 'ai_ml',
        prerequisites: ['python', 'ml'],
        estimatedHours: 18,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/nlp-natural-language-processing-with-python/',
        provider: 'Udemy',
        tags: ['nlp', 'python', 'text processing'],
    },
    {
        title: 'Docker & Kubernetes: The Practical Guide',
        skill: 'docker',
        skillCategory: 'cloud',
        prerequisites: [],
        estimatedHours: 23,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/',
        provider: 'Udemy',
        tags: ['docker', 'kubernetes', 'devops'],
    },
    {
        title: 'AWS Certified Solutions Architect - Associate',
        skill: 'amazon web services',
        skillCategory: 'cloud',
        prerequisites: [],
        estimatedHours: 40,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',
        provider: 'Udemy',
        tags: ['aws', 'cloud', 'devops'],
    },
    {
        title: 'Google Cloud Professional Data Engineer',
        skill: 'google cloud platform',
        skillCategory: 'cloud',
        prerequisites: [],
        estimatedHours: 35,
        level: 'intermediate',
        resourceUrl: 'https://www.coursera.org/professional-certificates/gcp-data-engineering',
        provider: 'Coursera (Google)',
        tags: ['gcp', 'cloud', 'data engineering'],
    },
    {
        title: 'Git & GitHub — The Complete Guide',
        skill: 'git',
        skillCategory: 'tool',
        prerequisites: [],
        estimatedHours: 6,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/git-github-practical-guide/',
        provider: 'Udemy',
        tags: ['git', 'github', 'version control'],
    },
    {
        title: 'GraphQL with React: The Complete Developers Guide',
        skill: 'graphql',
        skillCategory: 'tool',
        prerequisites: ['javascript', 'react'],
        estimatedHours: 13,
        level: 'intermediate',
        resourceUrl: 'https://www.udemy.com/course/graphql-with-react-course/',
        provider: 'Udemy',
        tags: ['graphql', 'api', 'react'],
    },
    {
        title: 'Communication Skills Masterclass',
        skill: 'communication',
        skillCategory: 'soft_skill',
        prerequisites: [],
        estimatedHours: 5,
        level: 'beginner',
        resourceUrl: 'https://www.udemy.com/course/communication-skills-master-class/',
        provider: 'Udemy',
        tags: ['communication', 'soft skills'],
    },
];
async function seedCourses() {
    console.log('🌱 Seeding course catalog...');
    if (!process.env.MONGODB_URI)
        throw new Error('MONGODB_URI not set');
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    let inserted = 0;
    let skipped = 0;
    for (const course of COURSES) {
        const exists = await Course_1.CourseModel.findOne({ skill: course.skill, provider: course.provider });
        if (exists) {
            skipped++;
            continue;
        }
        await Course_1.CourseModel.create(course);
        inserted++;
    }
    console.log(`✅ Courses seeded: ${inserted} inserted, ${skipped} already existed`);
    console.log(`   Total courses in DB: ${await Course_1.CourseModel.countDocuments()}`);
    await mongoose_1.default.disconnect();
    console.log('🔌 MongoDB disconnected');
}
seedCourses().catch((err) => {
    console.error('❌ Course seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seedCourses.js.map