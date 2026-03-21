"""
skill_extractor.py
------------------
Extracts technical skill keywords from free-form text (job descriptions, resumes).

Strategy (in priority order):
1. Keyword dictionary match (fast, zero-dep)
2. spaCy NER — noun chunks that match known tech patterns
3. OpenAI fallback (if OPENAI_API_KEY set and spaCy returns few results)
"""

import re
import os
from typing import List

# ---------------------------------------------------------------------------
# Curated skill dictionary (normalized lowercase)
# ---------------------------------------------------------------------------
SKILL_DICT = {
    # Languages
    'python', 'javascript', 'typescript', 'java', 'kotlin', 'swift', 'go', 'rust',
    'c', 'c++', 'c#', 'ruby', 'php', 'scala', 'r', 'matlab', 'bash', 'shell',
    'dart', 'elixir', 'haskell', 'perl', 'lua',

    # Web frontend
    'html', 'css', 'sass', 'less', 'react', 'angular', 'vue', 'svelte', 'nextjs',
    'next.js', 'nuxtjs', 'nuxt.js', 'gatsby', 'remix', 'jquery', 'tailwindcss',
    'tailwind', 'bootstrap', 'material-ui', 'mui', 'chakra ui', 'antd',
    'ant design', 'storybook', 'webpack', 'vite', 'rollup', 'parcel',

    # Backend / frameworks
    'node.js', 'nodejs', 'express', 'expressjs', 'fastapi', 'flask', 'django',
    'spring', 'spring boot', 'laravel', 'rails', 'ruby on rails', 'nestjs',
    'nest.js', 'hapi', 'koa', 'gin', 'echo', 'fiber', 'actix',

    # Databases
    'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'cassandra', 'dynamodb',
    'elasticsearch', 'neo4j', 'firebase', 'supabase', 'prisma', 'mongoose',
    'sqlalchemy', 'typeorm', 'sequelize', 'knex', 'couchdb', 'influxdb',

    # Cloud / DevOps
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
    'jenkins', 'github actions', 'gitlab ci', 'circle ci', 'travis ci',
    'nginx', 'apache', 'heroku', 'vercel', 'netlify', 'render',

    # Mobile
    'react native', 'flutter', 'android', 'ios', 'xcode', 'expo',

    # ML / AI / Data
    'machine learning', 'deep learning', 'neural networks', 'nlp',
    'natural language processing', 'computer vision', 'pytorch', 'tensorflow',
    'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'matplotlib',
    'seaborn', 'hugging face', 'transformers', 'langchain', 'openai',
    'llm', 'rag', 'vector database', 'pinecone', 'weaviate',

    # Data Engineering
    'spark', 'hadoop', 'kafka', 'airflow', 'dbt', 'snowflake', 'bigquery',
    'redshift', 'databricks', 'looker', 'tableau', 'power bi',

    # Auth / Security
    'jwt', 'oauth', 'oauth2', 'saml', 'ldap', 'keycloak',

    # Testing
    'jest', 'pytest', 'junit', 'mocha', 'chai', 'cypress', 'playwright',
    'selenium', 'vitest', 'testing library',

    # Tools / Misc
    'git', 'github', 'gitlab', 'jira', 'confluence', 'figma', 'postman',
    'graphql', 'rest', 'grpc', 'websocket', 'mqtt', 'rabbitmq',
    'linux', 'unix', 'macos',
}

# Common aliases → normalised form
ALIASES = {
    'js': 'javascript', 'ts': 'typescript', 'py': 'python',
    'reactjs': 'react', 'react.js': 'react',
    'vuejs': 'vue', 'vue.js': 'vue',
    'angularjs': 'angular',
    'node': 'node.js', 'node js': 'node.js',
    'express js': 'express', 'express.js': 'express',
    'next js': 'nextjs',
    'k8': 'kubernetes',
    'ml': 'machine learning', 'dl': 'deep learning',
    'tf': 'tensorflow', 'sk-learn': 'scikit-learn',
    'mongo': 'mongodb', 'postgres': 'postgresql',
    'pg': 'postgresql', 'mssql': 'sql server',
    'gke': 'kubernetes', 'eks': 'kubernetes', 'aks': 'kubernetes',
    'amazon web services': 'aws',
    'google cloud': 'gcp', 'google cloud platform': 'gcp',
    'microsoft azure': 'azure',
}


def _normalise(skill: str) -> str:
    s = skill.lower().strip()
    return ALIASES.get(s, s)


def _dict_match(text: str) -> List[str]:
    """Fast O(n·m) keyword scan."""
    text_lower = text.lower()
    found = set()

    # Sort by length descending to match longer phrases first
    for skill in sorted(SKILL_DICT, key=len, reverse=True):
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.add(_normalise(skill))

    return list(found)


def _spacy_match(text: str) -> List[str]:
    """spaCy noun-chunk extraction filtered by skill dictionary."""
    try:
        import spacy
        try:
            nlp = spacy.load('en_core_web_sm')
        except OSError:
            return []

        doc = nlp(text[:10000])  # cap at 10k chars for speed
        candidates = set()

        for chunk in doc.noun_chunks:
            c = chunk.text.lower().strip()
            n = _normalise(c)
            if n in SKILL_DICT:
                candidates.add(n)

        for ent in doc.ents:
            if ent.label_ in ('ORG', 'PRODUCT', 'WORK_OF_ART'):
                c = ent.text.lower().strip()
                n = _normalise(c)
                if n in SKILL_DICT:
                    candidates.add(n)

        return list(candidates)
    except Exception:
        return []


def _openai_fallback(text: str) -> List[str]:
    """OpenAI-powered fallback when dictionary match is thin."""
    api_key = os.getenv('OPENAI_API_KEY', '')
    if not api_key:
        return []
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        prompt = (
            "Extract a JSON array of technical skills from the following text. "
            "Return ONLY a JSON array of lowercase strings, nothing else.\n\n"
            f"Text:\n{text[:3000]}"
        )
        resp = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=300,
            temperature=0,
        )
        content = resp.choices[0].message.content.strip()
        # Parse JSON array safely
        import json
        raw = json.loads(content)
        return [_normalise(s) for s in raw if isinstance(s, str)]
    except Exception:
        return []


def extract_skills(text: str) -> List[str]:
    """
    Main entry point. Returns deduplicated normalised skill list.
    """
    dict_skills = _dict_match(text)
    spacy_skills = _spacy_match(text)

    combined = set(dict_skills) | set(spacy_skills)

    # Use OpenAI fallback only if we found very few skills
    if len(combined) < 3:
        combined |= set(_openai_fallback(text))

    # Final normalise pass
    return sorted({_normalise(s) for s in combined})
