"""
gap_engine.py
-------------
Enhanced gap computation that combines:
- Existing required_skills from DB
- NLP-extracted skills from raw job description
- Semantic similarity boost when exact string match misses close synonyms
"""

from typing import List, Dict
from modules.skill_extractor import extract_skills, _normalise
from modules.similarity import compute_similarity


def _normalise_list(skills: List[str]) -> List[str]:
    return list({_normalise(s) for s in skills if s})


def _soft_match(candidate: str, job_skills: List[str], threshold: float = 0.82) -> bool:
    """
    Returns True if the candidate skill is semantically close enough
    to any job skill (used to avoid marking near-duplicates as missing).
    """
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np

        model = SentenceTransformer('all-MiniLM-L6-v2')
        cand_emb = model.encode([candidate], normalize_embeddings=True)[0]
        job_embs = model.encode(job_skills, normalize_embeddings=True)
        scores = np.dot(job_embs, cand_emb)
        return bool(scores.max() >= threshold)
    except Exception:
        return False


def compute_enhanced_gap(
    candidate_skills: List[str],
    job_description: str,
    required_skills: List[str],
) -> Dict:
    """
    1. Extract additional skills from job_description text using NLP.
    2. Merge with required_skills (dedup, normalise).
    3. Run gap diff with optional semantic soft-match.
    4. Return enriched gap report.
    """

    # --- Step 1: Extract skills from raw JD text ---
    extracted = extract_skills(job_description) if job_description else []

    # --- Step 2: Merge job skill sets ---
    all_job_skills = _normalise_list(list(set(required_skills + extracted)))

    # --- Step 3: Normalise candidate skills ---
    norm_candidate = _normalise_list(candidate_skills)

    if not all_job_skills:
        return {
            'missing': [],
            'partial': [],
            'satisfied': norm_candidate,
            'gapScore': 0.0,
            'matchScore': 1.0,
            'extractedFromJD': [],
        }

    # --- Step 4: Hard match first ---
    candidate_set = set(norm_candidate)
    satisfied = [s for s in all_job_skills if s in candidate_set]
    missing_hard = [s for s in all_job_skills if s not in candidate_set]

    # --- Step 5: Soft (semantic) match on remaining missing ---
    soft_satisfied = []
    still_missing = []
    for skill in missing_hard:
        if _soft_match(skill, norm_candidate):
            soft_satisfied.append(skill)
        else:
            still_missing.append(skill)

    total = len(all_job_skills)
    matched = len(satisfied) + len(soft_satisfied)
    match_score = matched / total if total else 1.0
    gap_score = 1.0 - match_score

    return {
        'missing': still_missing,
        'partial': soft_satisfied,  # semantically close but not exact
        'satisfied': satisfied,
        'gapScore': round(gap_score, 4),
        'matchScore': round(match_score, 4),
        'extractedFromJD': extracted,
        'mergedJobSkills': all_job_skills,
    }
