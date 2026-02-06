"""
Knowledge Base Builder for FYP Chatbot RAG Pipeline

Processes FYP knowledge documents, chunks them into passages,
computes embeddings using sentence-transformers, and builds a
FAISS vector index for efficient similarity search.

Usage:
    python build_knowledge_base.py                                  # Default settings
    python build_knowledge_base.py --kb_dir knowledge_base          # Custom KB dir
    python build_knowledge_base.py --chunk_size 200 --overlap 50    # Custom chunking

Output:
    vector_store/index.faiss     - FAISS vector index
    vector_store/chunks.json     - Chunk metadata and text
    vector_store/config.json     - Index configuration
"""

import os
import json
import argparse
import time
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

try:
    import faiss
except ImportError:
    print("faiss-cpu not installed. Install with: pip install faiss-cpu")
    raise


# ============================================================================
# Document Loading
# ============================================================================

def load_documents(kb_dir):
    """Load all text documents from the knowledge base directory."""
    documents = []
    kb_path = Path(kb_dir)

    if not kb_path.exists():
        raise FileNotFoundError(f"Knowledge base directory not found: {kb_dir}")

    for file_path in sorted(kb_path.glob("*.txt")):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()

        if content:
            # Extract title from first line if it starts with "TITLE:"
            lines = content.split("\n")
            title = file_path.stem
            if lines[0].startswith("TITLE:"):
                title = lines[0].replace("TITLE:", "").strip()

            documents.append({
                "filename": file_path.name,
                "title": title,
                "content": content,
            })

    print(f"Loaded {len(documents)} documents from {kb_dir}")
    return documents


# ============================================================================
# Text Chunking
# ============================================================================

def chunk_text(text, chunk_size=200, overlap=50):
    """
    Split text into overlapping chunks of approximately `chunk_size` words.

    Uses a paragraph-aware strategy:
    1. Split by double newlines (paragraphs)
    2. Merge small paragraphs, split large ones
    3. Apply overlap between chunks
    """
    # Split into paragraphs
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    if not paragraphs:
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    chunks = []
    current_chunk = []
    current_word_count = 0

    for para in paragraphs:
        para_words = para.split()
        para_word_count = len(para_words)

        # If adding this paragraph exceeds chunk size
        if current_word_count + para_word_count > chunk_size and current_chunk:
            # Save current chunk
            chunk_text = "\n\n".join(current_chunk)
            chunks.append(chunk_text)

            # Keep overlap from the end of current chunk
            overlap_words = " ".join(chunk_text.split()[-overlap:])
            current_chunk = [overlap_words]
            current_word_count = overlap

        # If a single paragraph is very large, split it by sentences
        if para_word_count > chunk_size:
            sentences = para.replace(". ", ".\n").split("\n")
            for sentence in sentences:
                sent_words = len(sentence.split())
                if current_word_count + sent_words > chunk_size and current_chunk:
                    chunk_text = "\n\n".join(current_chunk)
                    chunks.append(chunk_text)
                    overlap_words = " ".join(chunk_text.split()[-overlap:])
                    current_chunk = [overlap_words]
                    current_word_count = overlap
                current_chunk.append(sentence)
                current_word_count += sent_words
        else:
            current_chunk.append(para)
            current_word_count += para_word_count

    # Don't forget the last chunk
    if current_chunk:
        chunk_text = "\n\n".join(current_chunk)
        if len(chunk_text.split()) > 20:  # Only keep chunks with enough content
            chunks.append(chunk_text)

    return chunks


def chunk_documents(documents, chunk_size=200, overlap=50):
    """Chunk all documents and return chunks with metadata."""
    all_chunks = []

    for doc in documents:
        chunks = chunk_text(doc["content"], chunk_size, overlap)
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "text": chunk,
                "source": doc["filename"],
                "title": doc["title"],
                "chunk_index": i,
                "total_chunks": len(chunks),
            })

    print(f"Created {len(all_chunks)} chunks from {len(documents)} documents")
    return all_chunks


# ============================================================================
# Embedding and Index Building
# ============================================================================

def build_faiss_index(chunks, embed_model, output_dir="vector_store"):
    """
    Compute embeddings for all chunks and build a FAISS index.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Extract texts for embedding
    texts = [chunk["text"] for chunk in chunks]

    print(f"Computing embeddings for {len(texts)} chunks...")
    start_time = time.time()
    embeddings = embed_model.encode(texts, show_progress_bar=True, batch_size=64)
    embed_time = time.time() - start_time
    print(f"Embeddings computed in {embed_time:.1f}s")

    # Convert to float32 numpy array
    embeddings = np.array(embeddings, dtype=np.float32)

    # Build FAISS index (using L2 distance with normalization for cosine similarity)
    dimension = embeddings.shape[1]

    # Normalize for cosine similarity (inner product after normalization = cosine)
    faiss.normalize_L2(embeddings)

    # Use IndexFlatIP for cosine similarity (inner product after normalization)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    # Save index
    index_path = os.path.join(output_dir, "index.faiss")
    faiss.write_index(index, index_path)
    print(f"Saved FAISS index to {index_path} ({index.ntotal} vectors, {dimension}d)")

    # Save chunk metadata
    chunks_path = os.path.join(output_dir, "chunks.json")
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
    print(f"Saved chunk metadata to {chunks_path}")

    # Save config
    config = {
        "embedding_model": "all-MiniLM-L6-v2",
        "embedding_dim": dimension,
        "num_chunks": len(chunks),
        "index_type": "IndexFlatIP",
        "similarity": "cosine",
        "chunk_size": 200,
        "chunk_overlap": 50,
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    config_path = os.path.join(output_dir, "config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    print(f"Saved config to {config_path}")

    return index


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Build knowledge base vector store")
    parser.add_argument("--kb_dir", type=str, default="knowledge_base",
                        help="Directory containing knowledge base .txt files")
    parser.add_argument("--output", type=str, default="vector_store",
                        help="Output directory for FAISS index and metadata")
    parser.add_argument("--chunk_size", type=int, default=200,
                        help="Target words per chunk")
    parser.add_argument("--overlap", type=int, default=50,
                        help="Words of overlap between chunks")
    args = parser.parse_args()

    # Load documents
    documents = load_documents(args.kb_dir)

    # Chunk documents
    chunks = chunk_documents(documents, args.chunk_size, args.overlap)

    # Load embedding model
    print("Loading sentence-transformer model (all-MiniLM-L6-v2)...")
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")

    # Build FAISS index
    index = build_faiss_index(chunks, embed_model, args.output)

    print(f"\nKnowledge base built successfully!")
    print(f"  Documents: {len(documents)}")
    print(f"  Chunks: {len(chunks)}")
    print(f"  Index vectors: {index.ntotal}")


if __name__ == "__main__":
    main()
