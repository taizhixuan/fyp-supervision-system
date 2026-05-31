"""
Multi-trait DistilBERT trainer for FYP proposal scoring (Route 2 distillation).

Distils the LLM teacher's rubric judgements (data/corpus_graded.jsonl) into a
single DistilBERT regression model that predicts FIVE dimensions at once:

    [clarity, structure, scope, innovation, feasibility]   each 0-1

Same architecture/tech as the original train_model.py — DistilBertForSequence-
Classification with problem_type="regression" — but num_labels=5 instead of 1,
trained on in-domain CS proposals instead of ASAP K-12 essays. The model reads
the actual proposal text to produce each dimension, replacing the gameable
keyword rules in nlp_utils.py.

Key correctness properties:
  * Stratified split by intended_tier, so WEAK proposals (tiers 1-2) appear in the
    test set and we can report accuracy on them explicitly (the user's priority).
  * Per-dimension RMSE/MAE + QWK, a weak-subset breakdown, and a composed-overall
    QWK against the teacher's holistic score.
  * Optional per-dimension isotonic calibration (stored as (x,y) points and applied
    with plain numpy interpolation at inference — no sklearn dependency in app.py),
    to keep the score range spread and pin the low end for weak proposals.

Output: models/proposal_scorer/  (config.json, model.safetensors, tokenizer,
training_metrics.json, calibration.json). app.py prefers this dir and falls back
to the legacy single-output models/essay_scorer/ if it is absent.

Usage
-----
    python train_multitrait.py --dataset data/corpus_graded.jsonl --epochs 4
"""

import os
import json
import time
import argparse
import warnings
from collections import defaultdict

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    DistilBertTokenizer,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup,
)
from sklearn.metrics import mean_squared_error, mean_absolute_error, cohen_kappa_score
try:
    from sklearn.isotonic import IsotonicRegression
    _HAVE_ISO = True
except Exception:
    _HAVE_ISO = False

warnings.filterwarnings("ignore")

DIMENSIONS = ["clarity", "structure", "scope", "innovation", "feasibility"]
# Transparent overall weighting (used only to validate a composed overall vs the
# teacher's holistic score; app.py uses the same shape).
OVERALL_WEIGHTS = {"clarity": 0.20, "structure": 0.20, "scope": 0.15,
                   "innovation": 0.15, "feasibility": 0.30}


class ProposalDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=512):
        self.texts = texts
        self.labels = labels  # list of [5] floats in 0-1
        self.tok = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        enc = self.tok(
            str(self.texts[idx]), max_length=self.max_length,
            padding="max_length", truncation=True, return_tensors="pt",
        )
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "labels": torch.tensor(self.labels[idx], dtype=torch.float),
        }


def load_graded(path):
    rows = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            s = r.get("scores") or {}
            if not all(k in s for k in DIMENSIONS):
                continue
            rows.append({
                "text": r["prose"],
                "tier": r.get("intended_tier", 0),
                "labels": [max(0.0, min(1.0, s[k] / 100.0)) for k in DIMENSIONS],
                "overall_teacher": s.get("overall", None),
            })
    return rows


def stratified_split(rows, val_frac=0.1, test_frac=0.15, seed=42):
    rng = np.random.RandomState(seed)
    by_tier = defaultdict(list)
    for i, r in enumerate(rows):
        by_tier[r["tier"]].append(i)
    train, val, test = [], [], []
    for tier, idxs in by_tier.items():
        idxs = list(idxs)
        rng.shuffle(idxs)
        n = len(idxs)
        n_test = max(1, int(round(n * test_frac))) if n >= 4 else 0
        n_val = max(1, int(round(n * val_frac))) if n >= 6 else 0
        test += idxs[:n_test]
        val += idxs[n_test:n_test + n_val]
        train += idxs[n_test + n_val:]
    return train, val, test


def train_epoch(model, loader, optim, sched, device):
    model.train()
    total, nb = 0.0, 0
    for batch in loader:
        ids = batch["input_ids"].to(device)
        mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)
        optim.zero_grad()
        out = model(input_ids=ids, attention_mask=mask)
        loss = torch.nn.MSELoss()(out.logits, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optim.step()
        sched.step()
        total += loss.item()
        nb += 1
    return total / max(nb, 1)


def predict(model, loader, device):
    model.eval()
    preds, labels = [], []
    with torch.no_grad():
        for batch in loader:
            ids = batch["input_ids"].to(device)
            mask = batch["attention_mask"].to(device)
            out = model(input_ids=ids, attention_mask=mask)
            preds.append(out.logits.cpu().numpy())
            labels.append(batch["labels"].numpy())
    return np.clip(np.vstack(preds), 0.0, 1.0), np.vstack(labels)


def qwk(y_true01, y_pred01):
    t = np.round(np.asarray(y_true01) * 10).astype(int)
    p = np.round(np.clip(y_pred01, 0, 1) * 10).astype(int)
    try:
        return float(round(cohen_kappa_score(t, p, weights="quadratic"), 4))
    except Exception:
        return 0.0


def per_dim_metrics(preds, labels, tag=""):
    m = {}
    for j, dim in enumerate(DIMENSIONS):
        yt, yp = labels[:, j], preds[:, j]
        m[dim] = {
            "rmse": float(round(np.sqrt(mean_squared_error(yt, yp)), 4)),
            "mae": float(round(mean_absolute_error(yt, yp), 4)),
            "qwk": qwk(yt, yp),
        }
    macro_qwk = float(round(np.mean([m[d]["qwk"] for d in DIMENSIONS]), 4))
    return {"by_dim": m, "macro_qwk": macro_qwk, "n": int(len(labels)), "tag": tag}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", default="data/corpus_graded.jsonl")
    ap.add_argument("--output", default="models/proposal_scorer")
    ap.add_argument("--epochs", type=int, default=4)
    ap.add_argument("--batch_size", type=int, default=8)
    ap.add_argument("--lr", type=float, default=2e-5)
    ap.add_argument("--max_length", type=int, default=512)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    rows = load_graded(args.dataset)
    print(f"Loaded {len(rows)} graded proposals")
    if len(rows) < 50:
        print("WARNING: very small dataset; metrics will be noisy.")
    tr, va, te = stratified_split(rows, seed=args.seed)
    print(f"Split -> train {len(tr)} / val {len(va)} / test {len(te)}")

    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    model = DistilBertForSequenceClassification.from_pretrained(
        "distilbert-base-uncased", num_labels=len(DIMENSIONS), problem_type="regression",
    )
    model.to(device)

    def mk(idxs):
        return ProposalDataset([rows[i]["text"] for i in idxs],
                               [rows[i]["labels"] for i in idxs], tokenizer, args.max_length)

    train_loader = DataLoader(mk(tr), batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(mk(va), batch_size=args.batch_size) if va else None
    test_loader = DataLoader(mk(te), batch_size=args.batch_size) if te else None

    optim = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    sched = get_linear_schedule_with_warmup(optim, int(total_steps * 0.1), total_steps)

    best = float("inf")
    os.makedirs(args.output, exist_ok=True)
    start = time.time()
    for epoch in range(1, args.epochs + 1):
        loss = train_epoch(model, train_loader, optim, sched, device)
        line = f"Epoch {epoch}/{args.epochs} | train MSE {loss:.4f}"
        if val_loader:
            vp, vl = predict(model, val_loader, device)
            vrmse = float(np.sqrt(mean_squared_error(vl, vp)))
            vmacro = np.mean([qwk(vl[:, j], vp[:, j]) for j in range(len(DIMENSIONS))])
            line += f" | val RMSE {vrmse:.4f} | val macroQWK {vmacro:.4f}"
            score = vrmse
        else:
            score = loss
        print(line)
        if score < best:
            best = score
            model.save_pretrained(args.output)
            tokenizer.save_pretrained(args.output)
            print(f"  -> saved (score {best:.4f})")

    elapsed = time.time() - start
    print(f"Training done in {elapsed:.0f}s")

    # Reload best for evaluation
    model = DistilBertForSequenceClassification.from_pretrained(args.output).to(device)

    metrics = {"dimensions": DIMENSIONS, "train_size": len(tr), "val_size": len(va),
               "test_size": len(te), "epochs": args.epochs, "batch_size": args.batch_size,
               "lr": args.lr, "base_model": "distilbert-base-uncased",
               "training_time_seconds": round(elapsed, 1),
               "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "device": str(device)}

    # Calibration on validation (predicted -> teacher), per dimension
    calibration = {}
    if val_loader and _HAVE_ISO:
        vp, vl = predict(model, val_loader, device)
        for j, dim in enumerate(DIMENSIONS):
            try:
                iso = IsotonicRegression(y_min=0.0, y_max=1.0, out_of_bounds="clip")
                iso.fit(vp[:, j], vl[:, j])
                xs = np.linspace(0, 1, 21)
                ys = iso.predict(xs)
                calibration[dim] = {"x": [float(round(x, 4)) for x in xs],
                                    "y": [float(round(y, 4)) for y in ys]}
            except Exception:
                pass

    if test_loader:
        tp, tl = predict(model, test_loader, device)
        metrics["test"] = per_dim_metrics(tp, tl, "test_all")

        # Weak-subset (intended tiers 1-2) metrics — the user's priority
        weak_mask = np.array([rows[i]["tier"] in (1, 2) for i in te])
        if weak_mask.sum() >= 3:
            metrics["test_weak"] = per_dim_metrics(tp[weak_mask], tl[weak_mask], "test_weak")
        strong_mask = np.array([rows[i]["tier"] in (4, 5) for i in te])
        if strong_mask.sum() >= 3:
            metrics["test_strong"] = per_dim_metrics(tp[strong_mask], tl[strong_mask], "test_strong")

        # Composed overall vs teacher overall
        w = np.array([OVERALL_WEIGHTS[d] for d in DIMENSIONS])
        comp_overall = np.clip(tp @ w, 0, 1)
        teacher_overall = np.array([rows[i]["overall_teacher"] for i in te], dtype=float)
        if np.all(np.isfinite(teacher_overall)):
            teacher_overall01 = np.clip(teacher_overall / 100.0, 0, 1)
            metrics["overall_composed_vs_teacher"] = {
                "rmse": float(round(np.sqrt(mean_squared_error(teacher_overall01, comp_overall)), 4)),
                "qwk": qwk(teacher_overall01, comp_overall),
            }

    with open(os.path.join(args.output, "training_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
    with open(os.path.join(args.output, "calibration.json"), "w") as f:
        json.dump(calibration, f, indent=2)

    print("\n=== TEST METRICS ===")
    print(json.dumps(metrics.get("test", {}), indent=2))
    if "test_weak" in metrics:
        print("\n=== WEAK-SUBSET (tiers 1-2) ===")
        print(json.dumps(metrics["test_weak"], indent=2))
    if "overall_composed_vs_teacher" in metrics:
        print("\n=== COMPOSED OVERALL vs TEACHER ===")
        print(json.dumps(metrics["overall_composed_vs_teacher"], indent=2))
    print(f"\nSaved model + metrics to {args.output}")


if __name__ == "__main__":
    main()
