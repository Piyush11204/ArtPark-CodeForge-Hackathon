FROM python:3.11-slim

# Install OS deps needed by spaCy
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# sentence-transformers caches models on first use — pre-download for faster cold start
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY . .

EXPOSE 6000

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:6000", "--timeout", "120", "app:app"]
