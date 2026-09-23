FROM python:3.11-slim

WORKDIR /app

# Build deps for transformers / torch wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# CPU-only torch wheels: these containers never use a GPU, and the default
# Linux wheel drags in ~2.5 GB of CUDA libraries. Long timeout + retries so a
# slow PyPI mirror doesn't fail the build.
RUN pip install --no-cache-dir --default-timeout=120 --retries 10 \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

COPY . .

EXPOSE 5002

# --preload: load the 268 MB DistilBERT model once in the master process,
# then fork. --workers 1 + --threads 4 keeps memory at ~half of the prior
# `--workers 2` configuration while still serving concurrent requests.
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "--preload", "--workers", "1", "--threads", "4", "--timeout", "180", "app:app"]
