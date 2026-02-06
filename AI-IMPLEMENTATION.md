# AI Implementation Summary

All five tasks are complete. Here's a summary of everything that was implemented.

---

## 1. AI Recommendation Service (port 5001) — 3 new files, 3 modified

### New files

- **`ai-recommendation/generate_training_data.py`** — Generates 10,000 synthetic student-supervisor pairs using an ACM CCS-inspired taxonomy with 8 research clusters, cross-cluster relationships, and realistic match labels
- **`ai-recommendation/train_model.py`** — Trains an XGBoost regression model on multi-signal features: semantic similarity (sentence-transformers), Jaccard overlap (research areas, skills, expertise), availability factor, and count features. Outputs `models/xgb_model.pkl`

### Modified

- **`app.py`** — Replaced TF-IDF with `all-MiniLM-L6-v2` sentence-transformer embeddings + trained XGBoost model for scoring. Falls back to embedding cosine similarity if model not trained yet
- **`requirements.txt`** — Added `sentence-transformers`, `xgboost`, `joblib`
- **`Dockerfile`** — Pre-downloads sentence-transformer model during build, increased Gunicorn timeout to 180s

---

## 2. AI Proposal Analyzer (port 5002) — 4 new files, 3 modified

### New files

- **`ai-proposal-analyzer/train_model.py`** — Fine-tunes DistilBERT on the ASAP essay scoring dataset (13k human-graded essays from Kaggle). Includes synthetic data fallback for testing the pipeline
- **`ai-proposal-analyzer/nlp_utils.py`** — Comprehensive NLP pipeline with Flesch-Kincaid readability, Gunning Fog index, section detection (8 proposal sections with weighted completeness), scope analysis (technical keywords, methodology presence), and innovation scoring (novelty indicators + existing work references)
- **`ai-proposal-analyzer/data/README.md`** — Instructions to download ASAP dataset from Kaggle

### Modified

- **`app.py`** — Combines DistilBERT quality prediction (when trained model available) with NLP metrics pipeline. Produces multi-dimensional scores (clarity, structure, scope, innovation, feasibility). OpenAI provides optional enhanced feedback
- **`requirements.txt`** — Added `transformers`, `torch`, `numpy`, `scikit-learn`
- **`Dockerfile`** — Increased timeout to 180s

---

## 3. AI Chatbot (port 5003) — 17 new files, 3 modified

### New files

- **`ai-chatbot/build_knowledge_base.py`** — Chunks documents into ~200-word passages with overlap, computes embeddings, builds FAISS index with normalized cosine similarity
- **`ai-chatbot/rag_engine.py`** — Full RAG pipeline with FAISS retrieval, intent classification, Flan-T5-small local generation, OpenAI enhanced generation, extractive fallback, and static fallback
- **`ai-chatbot/knowledge_base/`** — 15 comprehensive FYP knowledge documents covering overview, proposal writing, meeting logs, report writing, timeline planning, research methodology, literature review, technical writing, presentations, common pitfalls, technology guidance, supervisor selection, MMU procedures, testing/evaluation, and FAQ

### Modified

- **`app.py`** — Replaced keyword matching with RAG engine. Uses FAISS vector search + Flan-T5-small for local generation, OpenAI for enhanced responses when available
- **`requirements.txt`** — Added `sentence-transformers`, `faiss-cpu`, `transformers`, `torch`
- **`Dockerfile`** — Pre-downloads both sentence-transformer and Flan-T5-small models, auto-builds vector store during Docker build

---

## 4. Backend Fix

- **`StudentProposalController.java`** — Fixed to send full `ProposalVersion.contentText` (latest version) instead of just `proposal.getTitle()` to the AI analyzer

---

## 5. Docker Compose

- **`docker-compose.yml`** — Added persistent volumes for model artifacts (`recommendation_models`, `analyzer_models`, `chatbot_vector_store`), added `USE_LOCAL_GEN` environment variable for chatbot

---

## How to Train (Google Colab)

### 1. Recommendation model

```bash
cd ai-recommendation
python generate_training_data.py
python train_model.py
# -> outputs models/xgb_model.pkl
```

### 2. Proposal analyzer model

```bash
cd ai-proposal-analyzer
# Download training_set.tsv from https://www.kaggle.com/competitions/asap-aes/data
python train_model.py --dataset data/training_set.tsv --epochs 3
# -> outputs models/essay_scorer/
```

### 3. Chatbot vector store

```bash
cd ai-chatbot
python build_knowledge_base.py
# -> outputs vector_store/index.faiss
```

> All three services work **without** trained models (graceful fallback) but produce significantly better results with them.
