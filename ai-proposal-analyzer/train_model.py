"""
Training Script for FYP Proposal Quality Scorer

Fine-tunes DistilBERT on the ASAP Automated Essay Scoring (AES) dataset
to predict text quality scores. The trained model is used to evaluate
FYP proposal quality along multiple dimensions.

Dataset:
    Download from: https://www.kaggle.com/competitions/asap-aes/data
    Place `training_set.tsv` in the `data/` directory.

Usage (Google Colab with GPU):
    !pip install transformers torch datasets scikit-learn pandas numpy
    !python train_model.py --dataset data/training_set.tsv --epochs 3

Usage (local):
    python train_model.py --dataset data/training_set.tsv --epochs 3

Output:
    models/essay_scorer/           - Fine-tuned DistilBERT model and tokenizer
    models/training_metrics.json   - Training metrics and configuration
"""

import os
import json
import argparse
import time
import warnings

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    DistilBertTokenizer,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup,
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, cohen_kappa_score

warnings.filterwarnings("ignore")


# ============================================================================
# Dataset
# ============================================================================

class EssayDataset(Dataset):
    """PyTorch dataset for essay scoring."""

    def __init__(self, texts, scores, tokenizer, max_length=512):
        self.texts = texts
        self.scores = scores
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        score = self.scores[idx]

        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(score, dtype=torch.float),
        }


# ============================================================================
# Data Loading & Preprocessing
# ============================================================================

def load_asap_data(filepath):
    """
    Load and preprocess the ASAP essay scoring dataset.

    The ASAP dataset has 8 essay sets with different scoring ranges.
    We normalize all scores to 0-1 range for uniform training.
    """
    print(f"Loading ASAP dataset from {filepath}...")

    df = pd.read_csv(filepath, sep="\t", encoding="latin-1")
    print(f"Loaded {len(df)} essays")

    # The ASAP dataset has columns: essay_id, essay_set, essay, domain1_score, ...
    # We use domain1_score as the primary score
    required_cols = ["essay", "essay_set", "domain1_score"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}. Available: {df.columns.tolist()}")

    # Score ranges for each essay set (for normalization)
    score_ranges = {
        1: (2, 12), 2: (1, 6), 3: (0, 3), 4: (0, 3),
        5: (0, 4), 6: (0, 4), 7: (0, 30), 8: (0, 60),
    }

    # Normalize scores to 0-1
    normalized_scores = []
    for _, row in df.iterrows():
        essay_set = row["essay_set"]
        raw_score = row["domain1_score"]
        min_score, max_score = score_ranges.get(essay_set, (0, 12))
        normalized = (raw_score - min_score) / (max_score - min_score)
        normalized = max(0.0, min(1.0, normalized))
        normalized_scores.append(normalized)

    df["normalized_score"] = normalized_scores

    # Clean text
    df["essay"] = df["essay"].fillna("").astype(str)
    df = df[df["essay"].str.len() > 50]  # Remove very short entries

    print(f"After cleaning: {len(df)} essays")
    print(f"Score distribution: mean={df['normalized_score'].mean():.3f}, "
          f"std={df['normalized_score'].std():.3f}")

    return df["essay"].tolist(), df["normalized_score"].tolist()


def create_synthetic_data():
    """
    Create synthetic essay data for testing when ASAP dataset is not available.
    Generates essays of varying quality with corresponding scores.
    """
    print("ASAP dataset not found. Creating synthetic training data...")

    high_quality_templates = [
        "This research proposes a comprehensive investigation into {topic}. "
        "The problem statement addresses a significant gap in the existing literature. "
        "The methodology employs a rigorous {method} approach with clearly defined objectives. "
        "Expected outcomes include practical applications in {domain} and contributions to "
        "the academic body of knowledge. The scope is well-defined with realistic timelines "
        "and measurable deliverables. The literature review covers key works in the field "
        "and identifies clear research gaps that this study aims to address.",

        "The proposed study aims to develop and evaluate a novel {topic} system. "
        "This research is motivated by the growing need for {domain} solutions in modern computing. "
        "Using {method} methodology, the project will systematically design, implement, and test "
        "the proposed solution against established benchmarks. The objectives are specific, "
        "measurable, achievable, relevant, and time-bound. Key contributions include a new "
        "framework for {topic} and empirical evidence of its effectiveness.",
    ]

    medium_quality_templates = [
        "This project is about {topic}. The aim is to create something related to {domain}. "
        "We will use {method} to build the system. The project should be completed in two semesters. "
        "Some related work exists but we plan to do something different.",

        "The proposal focuses on {topic} for {domain} applications. The main goal is to "
        "develop a working prototype. We will research existing solutions and create our own version. "
        "The methodology involves {method} development with basic testing.",
    ]

    low_quality_templates = [
        "I want to do something with {topic}. It will be about {domain}.",
        "This is a project about {topic}. I will build it using {method}.",
    ]

    topics = ["machine learning", "web development", "cybersecurity", "data analytics",
              "mobile applications", "cloud computing", "IoT systems", "blockchain"]
    methods = ["agile", "waterfall", "prototyping", "experimental", "design science"]
    domains = ["healthcare", "education", "finance", "e-commerce", "smart cities"]

    import random
    random.seed(42)

    texts = []
    scores = []

    for _ in range(3000):
        quality = random.choices(["high", "medium", "low"], weights=[0.3, 0.4, 0.3])[0]
        topic = random.choice(topics)
        method = random.choice(methods)
        domain = random.choice(domains)

        if quality == "high":
            template = random.choice(high_quality_templates)
            base_score = random.uniform(0.7, 0.95)
        elif quality == "medium":
            template = random.choice(medium_quality_templates)
            base_score = random.uniform(0.35, 0.65)
        else:
            template = random.choice(low_quality_templates)
            base_score = random.uniform(0.1, 0.35)

        text = template.format(topic=topic, method=method, domain=domain)
        noise = random.gauss(0, 0.05)
        score = max(0.0, min(1.0, base_score + noise))

        texts.append(text)
        scores.append(score)

    print(f"Generated {len(texts)} synthetic essays")
    return texts, scores


# ============================================================================
# Training
# ============================================================================

def train_epoch(model, dataloader, optimizer, scheduler, device):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    num_batches = 0

    for batch in dataloader:
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)

        optimizer.zero_grad()

        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        logits = outputs.logits.squeeze(-1)

        loss = torch.nn.MSELoss()(logits, labels)
        loss.backward()

        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        scheduler.step()

        total_loss += loss.item()
        num_batches += 1

    return total_loss / max(num_batches, 1)


def evaluate(model, dataloader, device):
    """Evaluate the model."""
    model.eval()
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"]

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            preds = outputs.logits.squeeze(-1).cpu().numpy()

            all_preds.extend(preds.tolist())
            all_labels.extend(labels.numpy().tolist())

    all_preds = np.clip(all_preds, 0.0, 1.0)
    all_labels = np.array(all_labels)
    all_preds = np.array(all_preds)

    mse = mean_squared_error(all_labels, all_preds)
    mae = mean_absolute_error(all_labels, all_preds)
    rmse = np.sqrt(mse)

    # Compute QWK (Quadratic Weighted Kappa) - standard metric for essay scoring
    # Discretize to 0-10 scale for kappa computation
    labels_discrete = np.round(all_labels * 10).astype(int)
    preds_discrete = np.round(all_preds * 10).astype(int)
    try:
        qwk = cohen_kappa_score(labels_discrete, preds_discrete, weights="quadratic")
    except Exception:
        qwk = 0.0

    return {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "qwk": round(qwk, 4),
    }


def main():
    parser = argparse.ArgumentParser(description="Train essay quality scorer")
    parser.add_argument("--dataset", type=str, default="data/training_set.tsv",
                        help="Path to ASAP training data TSV")
    parser.add_argument("--output", type=str, default="models/essay_scorer",
                        help="Output directory for model")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate")
    parser.add_argument("--max_length", type=int, default=512, help="Max token length")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load data
    if os.path.exists(args.dataset):
        texts, scores = load_asap_data(args.dataset)
    else:
        print(f"Dataset not found at {args.dataset}")
        texts, scores = create_synthetic_data()

    # Train/val/test split
    texts_train, texts_test, scores_train, scores_test = train_test_split(
        texts, scores, test_size=0.15, random_state=42
    )
    texts_train, texts_val, scores_train, scores_val = train_test_split(
        texts_train, scores_train, test_size=0.15, random_state=42
    )
    print(f"Train: {len(texts_train)}, Val: {len(texts_val)}, Test: {len(texts_test)}")

    # Load tokenizer and model
    print("Loading DistilBERT model and tokenizer...")
    model_name = "distilbert-base-uncased"
    tokenizer = DistilBertTokenizer.from_pretrained(model_name)
    model = DistilBertForSequenceClassification.from_pretrained(
        model_name,
        num_labels=1,  # Regression: single output
        problem_type="regression",
    )
    model.to(device)

    # Create datasets
    train_dataset = EssayDataset(texts_train, scores_train, tokenizer, args.max_length)
    val_dataset = EssayDataset(texts_val, scores_val, tokenizer, args.max_length)
    test_dataset = EssayDataset(texts_test, scores_test, tokenizer, args.max_length)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size)

    # Optimizer and scheduler
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps,
    )

    # Training loop
    best_val_rmse = float("inf")
    print(f"\nStarting training for {args.epochs} epochs...")
    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        train_loss = train_epoch(model, train_loader, optimizer, scheduler, device)
        val_metrics = evaluate(model, val_loader, device)

        print(f"Epoch {epoch}/{args.epochs} | "
              f"Train Loss: {train_loss:.4f} | "
              f"Val RMSE: {val_metrics['rmse']:.4f} | "
              f"Val MAE: {val_metrics['mae']:.4f} | "
              f"Val QWK: {val_metrics['qwk']:.4f}")

        # Save best model
        if val_metrics["rmse"] < best_val_rmse:
            best_val_rmse = val_metrics["rmse"]
            model.save_pretrained(args.output)
            tokenizer.save_pretrained(args.output)
            print(f"  -> Saved best model (RMSE: {best_val_rmse:.4f})")

    elapsed = time.time() - start_time
    print(f"\nTraining completed in {elapsed:.1f}s")

    # Final evaluation on test set
    print("\nLoading best model for final evaluation...")
    model = DistilBertForSequenceClassification.from_pretrained(args.output)
    model.to(device)
    test_metrics = evaluate(model, test_loader, device)

    print("\n=== Test Set Results ===")
    print(f"  RMSE: {test_metrics['rmse']:.4f}")
    print(f"  MAE:  {test_metrics['mae']:.4f}")
    print(f"  QWK:  {test_metrics['qwk']:.4f}")

    # Save training metadata
    metadata = {
        "base_model": model_name,
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.lr,
        "max_length": args.max_length,
        "train_size": len(texts_train),
        "val_size": len(texts_val),
        "test_size": len(texts_test),
        "test_metrics": test_metrics,
        "training_time_seconds": round(elapsed, 1),
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "device": str(device),
    }
    metadata_path = os.path.join(args.output, "training_metrics.json")
    os.makedirs(args.output, exist_ok=True)
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"\nSaved training metadata to {metadata_path}")


if __name__ == "__main__":
    main()
