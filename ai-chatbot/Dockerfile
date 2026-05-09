FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download models during build (avoids runtime download).
# Flan-T5 is opt-in via USE_LOCAL_GEN=true; the embedding model is always needed.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
RUN python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; AutoTokenizer.from_pretrained('google/flan-t5-small'); AutoModelForSeq2SeqLM.from_pretrained('google/flan-t5-small')"

COPY . .

# Build the knowledge base vector store if not already present
RUN if [ ! -f vector_store/index.faiss ]; then python build_knowledge_base.py; fi

EXPOSE 5003

# --preload: load the RAG engine + models ONCE in the master before forking
# workers, so the FAISS index and any optional Flan-T5 weights aren't
# duplicated across processes. --workers 1 --threads 4 fits the I/O profile
# (most time is spent waiting on the remote LLM, not on local CPU).
CMD ["gunicorn", "--bind", "0.0.0.0:5003", "--preload", "--workers", "1", "--threads", "4", "--timeout", "180", "app:app"]
