from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from modules.skill_extractor import extract_skills
from modules.gap_engine import compute_enhanced_gap
from modules.similarity import compute_similarity

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'artpark-ml-service'})


@app.route('/extract-skills', methods=['POST'])
def extract_skills_endpoint():
    """
    POST { "text": "<job description or resume text>" }
    Returns { "skills": ["python", "react", ...] }
    """
    data = request.get_json(force=True)
    text = data.get('text', '')
    if not text or not text.strip():
        return jsonify({'error': 'text field is required'}), 400

    skills = extract_skills(text)
    return jsonify({'skills': skills})


@app.route('/similarity-score', methods=['POST'])
def similarity_score():
    """
    POST { "skills_a": [...], "skills_b": [...] }
    Returns { "score": 0.85, "method": "embedding" }
    """
    data = request.get_json(force=True)
    skills_a = data.get('skills_a', [])
    skills_b = data.get('skills_b', [])
    if not isinstance(skills_a, list) or not isinstance(skills_b, list):
        return jsonify({'error': 'skills_a and skills_b must be arrays'}), 400

    result = compute_similarity(skills_a, skills_b)
    return jsonify(result)


@app.route('/enhance-gap', methods=['POST'])
def enhance_gap():
    """
    POST { "candidate_skills": [...], "job_description": "...", "required_skills": [...] }
    Returns enhanced gap report with NLP-extracted skills merged in.
    """
    data = request.get_json(force=True)
    candidate_skills = data.get('candidate_skills', [])
    job_description = data.get('job_description', '')
    required_skills = data.get('required_skills', [])

    result = compute_enhanced_gap(candidate_skills, job_description, required_skills)
    return jsonify(result)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 6000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
