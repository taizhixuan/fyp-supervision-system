"""
Run before the server starts (see Dockerfile CMD).

The FAISS index lives in the chatbot_vector_store volume, which outlives image
rebuilds, so an index built once would otherwise be served forever even after
knowledge_base/*.txt changes. Rebuild when the index is missing or was built from
different knowledge-base content.
"""
import json
import subprocess
import sys
from pathlib import Path

from build_knowledge_base import knowledge_base_hash

VECTOR_STORE = Path("vector_store")


def main():
    config_path = VECTOR_STORE / "config.json"
    current = knowledge_base_hash("knowledge_base")
    stored = None
    if (VECTOR_STORE / "index.faiss").exists() and config_path.exists():
        try:
            stored = json.loads(config_path.read_text(encoding="utf-8")).get("kb_hash")
        except (OSError, ValueError):
            stored = None
    if stored == current:
        print("Knowledge base index is up to date.")
        return
    print("Knowledge base changed or index missing; rebuilding the FAISS index...")
    subprocess.run([sys.executable, "build_knowledge_base.py"], check=True)


if __name__ == "__main__":
    main()
