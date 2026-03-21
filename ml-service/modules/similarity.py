"""
similarity.py
-------------
Computes semantic similarity between two skill sets.

Strategy:
1. Sentence-transformers embeddings (all-MiniLM-L6-v2) — best quality
2. Jaccard coefficient fallback if model unavailable
"""

from typing import List, Dict
import numpy as np


def _jaccard(a: List[str], b: List[str]) -> float:
    if not a and not b:
        return 1.0
    set_a, set_b = set(a), set(b)
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union else 0.0


def _embedding_similarity(a: List[str], b: List[str]) -> float:
    """Mean-pool skill embeddings then cosine-sim of the two centroids."""
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')

        # Encode as comma-joined strings for context
        text_a = ', '.join(a) if a else 'none'
        text_b = ', '.join(b) if b else 'none'

        emb_a, emb_b = model.encode([text_a, text_b], normalize_embeddings=True)
        score = float(np.dot(emb_a, emb_b))
        return max(0.0, min(1.0, score))
    except Exception:
        return None  # type: ignore


def compute_similarity(skills_a: List[str], skills_b: List[str]) -> Dict:
    embedding_score = _embedding_similarity(skills_a, skills_b)

    if embedding_score is not None:
        return {
            'score': round(embedding_score, 4),
            'method': 'embedding',
            'model': 'all-MiniLM-L6-v2',
        }

    jaccard = _jaccard(skills_a, skills_b)
    return {
        'score': round(jaccard, 4),
        'method': 'jaccard',
        'model': None,
    }
