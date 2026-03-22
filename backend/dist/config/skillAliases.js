"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNONYM_LOOKUP = exports.SKILL_SYNONYM_GROUPS = exports.SKILL_EXPANSIONS = exports.SKILL_ALIASES = void 0;
exports.normalizeSkill = normalizeSkill;
exports.normalizeSkills = normalizeSkills;
exports.SKILL_ALIASES = {
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
    py: 'python',
    python3: 'python',
    'tailwind css': 'tailwindcss',
    tailwind: 'tailwindcss',
    'bootstrap css': 'bootstrap',
    scss: 'sass',
    mongo: 'mongodb',
    'mongo db': 'mongodb',
    postgres: 'postgresql',
    pg: 'postgresql',
    mysql: 'mysql',
    mssql: 'sql server',
    'ms sql': 'sql server',
    redis: 'redis',
    elastic: 'elasticsearch',
    aws: 'amazon web services',
    gcp: 'google cloud platform',
    'google cloud': 'google cloud platform',
    k8s: 'kubernetes',
    'docker compose': 'docker',
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
    flutter: 'flutter',
    'react-native': 'react-native',
    ios: 'ios',
    android: 'android',
    jest: 'jest',
    mocha: 'mocha',
    cypress: 'cypress',
    selenium: 'selenium',
};
exports.SKILL_EXPANSIONS = {
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
exports.SKILL_SYNONYM_GROUPS = [
    ['crm', 'salesforce', 'hubspot', 'zendesk', 'dynamics 365', 'customer relationship management', 'pipedrive', 'intercom'],
    ['customer success', 'customer support', 'account management', 'client success', 'customer service', 'client management'],
    ['saas', 'software as a service', 'cloud software', 'cloud platform'],
    ['b2b', 'enterprise sales', 'business development', 'enterprise accounts', 'partner management'],
    ['b2c', 'consumer marketing', 'direct to consumer', 'd2c'],
    ['problem solving', 'data structures and algorithms', 'dsa', 'analytical thinking', 'critical thinking', 'algorithms'],
    ['project management', 'agile', 'scrum', 'kanban', 'product management'],
    ['communication', 'presentation skills', 'public speaking', 'stakeholder management'],
    ['ml', 'machine learning', 'deep learning', 'dl', 'artificial intelligence', 'ai'],
    ['nlp', 'natural language processing', 'text analysis', 'language model', 'llm', 'generative ai'],
    ['data analysis', 'data science', 'analytics', 'business intelligence', 'tableau', 'power bi', 'excel', 'statistics'],
    ['cloud computing', 'amazon web services', 'google cloud platform', 'azure', 'gcp', 'aws', 'heroku', 'vercel', 'netlify'],
    ['database', 'sql', 'mysql', 'postgresql', 'mongodb', 'sqlite', 'firebase'],
    ['git', 'github', 'version control', 'gitlab'],
    ['leadership', 'team management', 'people management', 'mentoring'],
    ['onboarding', 'customer success', 'product adoption', 'training'],
];
const _synonymLookup = new Map();
for (const group of exports.SKILL_SYNONYM_GROUPS) {
    const normGroup = group.map(s => s.toLowerCase().trim());
    const groupSet = new Set(normGroup);
    for (const skill of normGroup) {
        const existing = _synonymLookup.get(skill);
        if (existing) {
            groupSet.forEach(s => existing.add(s));
        }
        else {
            _synonymLookup.set(skill, new Set(groupSet));
        }
    }
}
exports.SYNONYM_LOOKUP = _synonymLookup;
function normalizeSkill(skill) {
    const lower = skill.toLowerCase().trim();
    return exports.SKILL_ALIASES[lower] ?? lower;
}
function normalizeSkills(skills) {
    return [...new Set(skills.map(normalizeSkill).filter(Boolean))];
}
//# sourceMappingURL=skillAliases.js.map