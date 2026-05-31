"""
LLM teacher grader (training-label generation, offline).

Reads `corpus.jsonl` (from generate_corpus.py) and grades each proposal on the
system's five dimensions — clarity, structure, scope, innovation, feasibility —
plus an overall holistic score, using the remote LLM (Groq Llama 3.3 70B) as the
teacher. These scores are the SOFT LABELS distilled into the multi-trait
DistilBERT in train_multitrait.py.

Design choices that protect label quality (this is what determines model accuracy):
  * Absolute anchored rubric: every dimension has explicit 0/40/70/100 anchors,
    plus two worked calibration exemplars (a very-weak and an excellent proposal
    with reference scores) so the teacher calibrates the *bottom* of the scale —
    critical because we need genuine accuracy on weak proposals, not a mid-band mush.
  * Independent grading: one proposal per call by default, graded against the rubric
    in isolation (no relative comparison that would compress the scale).
  * Low temperature + optional self-consistency (--samples) median for stability.
  * Resumable: skips ids already in the output; safe to re-run after a rate-limit stop.

Output `corpus_graded.jsonl`: each input record plus
    "scores": { clarity, structure, scope, innovation, feasibility, overall }  # 0-100 ints
    "teacher_model": "<model id>"

Usage
-----
    python data/grade_corpus.py --in data/corpus.jsonl --out data/corpus_graded.jsonl
"""

import os
import re
import sys
import json
import time
import random
import argparse
import logging
import threading
import statistics
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("grade_corpus")

GROQ_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1"
OPENAI_DEFAULT_MODEL = "gpt-4o-mini"

DIMENSIONS = ["clarity", "structure", "scope", "innovation", "feasibility"]


def _load_dotenv_if_needed():
    if any(os.environ.get(k, "").strip() for k in ("LLM_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY")):
        return
    here = Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        env = parent / ".env"
        if env.exists():
            for line in env.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k and v and not os.environ.get(k):
                    os.environ[k] = v
            return


def _env(name, default=None):
    raw = os.environ.get(name)
    return default if raw is None or raw.strip() == "" else raw


def resolve_llm():
    key = _env("LLM_API_KEY")
    if key:
        return key, _env("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL), _env("LLM_MODEL", GROQ_DEFAULT_MODEL)
    key = _env("GROQ_API_KEY")
    if key:
        return key, _env("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL), _env("LLM_MODEL", GROQ_DEFAULT_MODEL)
    key = _env("OPENAI_API_KEY")
    if key:
        return key, _env("LLM_BASE_URL", OPENAI_DEFAULT_BASE_URL), _env("LLM_MODEL", OPENAI_DEFAULT_MODEL)
    logger.error("No LLM key found (GROQ_API_KEY / OPENAI_API_KEY / LLM_API_KEY or .env).")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Rubric
# ---------------------------------------------------------------------------

RUBRIC = """You grade an undergraduate Computer Science Final-Year-Project (FYP) PROPOSAL
on five dimensions, each an integer 0-100, on an ABSOLUTE scale. Do not grade leniently.

clarity      = writing quality and readability: clear academic language, coherent
               sentences, no vagueness or hand-waving. 0 = incoherent/one-liners,
               40 = understandable but clumsy/vague, 70 = clear and professional,
               100 = crisp, precise, publication-grade.
structure    = completeness and organisation of the proposal: are problem, objectives,
               methodology, scope, expected outcomes (and timeline) all PRESENT and
               SUBSTANTIVE, logically ordered? 0 = sections missing or one word each,
               40 = present but thin, 70 = all present and adequately developed,
               100 = thorough, well-organised, each section pulls its weight.
scope        = is the project scope well-defined, bounded, and realistic for one student
               in ~2 semesters? 0 = undefined or absurdly broad/trivial, 40 = vague or
               mis-sized, 70 = clearly bounded and reasonable, 100 = precisely delimited
               with explicit inclusions/exclusions and right-sized ambition.
innovation   = novelty and contribution, and awareness of existing work: does it propose
               something non-trivial and position it against prior solutions? Merely
               writing the words "novel/innovative" earns NOTHING. 0 = trivial/derivative
               with no awareness, 40 = standard idea, little positioning, 70 = a clear
               contribution with some comparison to existing work, 100 = genuinely novel,
               well-situated in the literature.
feasibility  = can a final-year student actually deliver this? Soundness and concreteness
               of methodology (named techniques, tools, data, evaluation), and realism of
               time/resources. 0 = no method or impossible, 40 = method named but vague,
               70 = concrete, achievable method and plan, 100 = rigorous, clearly
               achievable, with evaluation and risk awareness.

overall = your holistic 0-100 judgement of proposal quality (NOT a mechanical average)."""

# Two compact calibration anchors so the teacher pins the ends of the scale.
ANCHOR_WEAK = """Title:
AI-Powered System for Finance

Problem Statement:
Finance companies need to know what is happening.

Objectives:
1. Make a system that uses AI to help finance companies
2. Make it work

Methodology:
I will use Python and do some research.

Scope:
It will be used by all finance companies and will make them a lot of money.

Expected Outcomes:
1. A working system
2. More money"""

ANCHOR_WEAK_SCORES = {"clarity": 20, "structure": 22, "scope": 12, "innovation": 8,
                      "feasibility": 15, "overall": 15}

ANCHOR_STRONG = """Title:
A Hybrid CNN-BiLSTM Model for Code-Mixed Malay-English Sentiment Analysis on Social Media

Problem Statement:
Sentiment analysis of Malaysian social media is hampered by frequent code-mixing of Malay
and English within a single post, which degrades the accuracy of monolingual models. Existing
public Malay sentiment lexicons do not cover code-mixed slang, leaving a measurable gap.

Objectives:
1. To construct and annotate a 10,000-post code-mixed Malay-English sentiment dataset
2. To design a hybrid CNN-BiLSTM classifier with sub-word embeddings for code-mixed text
3. To evaluate the model against mBERT and a CNN baseline, targeting a >=5% macro-F1 gain

Methodology:
Posts are collected via the X API and labelled by three annotators (Cohen's kappa reported).
Text is tokenised with sub-word BPE to handle slang. A CNN captures local n-gram features
which feed a BiLSTM for sequence context; training uses Adam with early stopping. Evaluation
uses stratified 5-fold cross-validation reporting macro-F1, precision and recall against
mBERT and CNN baselines, with McNemar significance testing.

Scope:
Scope is limited to text-only, binary/neutral sentiment on public posts. Image, video and
sarcasm detection are explicitly excluded. Only Malay-English code-mixing is handled.

Expected Outcomes:
1. An annotated code-mixed dataset released for reuse
2. A trained hybrid model with documented macro-F1 improvement over baselines
3. A short technical report and reproducible code

Timeline:
Sem 1: literature review, data collection and annotation (weeks 1-7), baseline models
(weeks 8-14). Sem 2: hybrid model development (weeks 1-6), evaluation (weeks 7-10),
write-up (weeks 11-14)."""

ANCHOR_STRONG_SCORES = {"clarity": 90, "structure": 92, "scope": 90, "innovation": 84,
                        "feasibility": 90, "overall": 90}


def build_grading_messages(prose):
    system = (
        "You are a strict, experienced FYP proposal examiner. You grade each proposal "
        "INDEPENDENTLY against an absolute rubric — never relative to other proposals. "
        "Weak proposals must receive genuinely low scores. Output ONLY a JSON object."
    )
    user = (
        f"{RUBRIC}\n\n"
        "=== CALIBRATION ANCHORS ===\n"
        f"ANCHOR 1 (very weak):\n{ANCHOR_WEAK}\nReference scores: {json.dumps(ANCHOR_WEAK_SCORES)}\n\n"
        f"ANCHOR 2 (excellent):\n{ANCHOR_STRONG}\nReference scores: {json.dumps(ANCHOR_STRONG_SCORES)}\n\n"
        "=== PROPOSAL TO GRADE ===\n"
        f"{prose}\n\n"
        "Grade this proposal. First reason in one short sentence per dimension, then output "
        "a JSON object on the last line with integer 0-100 values and these keys exactly: "
        '{"clarity":int,"structure":int,"scope":int,"innovation":int,"feasibility":int,'
        '"overall":int}. Output the JSON object last.'
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def extract_json_object(raw):
    if not raw:
        return None
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    # take the LAST {...} so trailing JSON after reasoning wins
    starts = [m.start() for m in re.finditer(r"\{", text)]
    ends = [m.start() for m in re.finditer(r"\}", text)]
    if starts and ends:
        text = text[starts[0]: ends[-1] + 1]
        # if reasoning contained braces, retry from the last plausible object
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{[^{}]*\"overall\"[^{}]*\}", raw)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                return None
        return None


def valid_scores(obj):
    if not isinstance(obj, dict):
        return None
    out = {}
    for k in DIMENSIONS + ["overall"]:
        v = obj.get(k)
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            return None
        out[k] = max(0, min(100, int(round(v))))
    return out


def grade_one(client, model, prose, samples, max_retries=4):
    """Return a dict of 0-100 scores (median over `samples`) or None."""
    collected = []
    for _ in range(max(1, samples)):
        delay = 3.0
        got = None
        for attempt in range(1, max_retries + 1):
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=build_grading_messages(prose),
                    temperature=0.2,
                    max_tokens=600,
                )
                raw = (resp.choices[0].message.content or "").strip()
                got = valid_scores(extract_json_object(raw))
                if got:
                    break
                raise ValueError("unparseable scores")
            except Exception as e:
                if attempt == max_retries:
                    logger.warning("grade failed: %s", str(e)[:140])
                    break
                wait = delay * (2 ** (attempt - 1)) + random.uniform(0, 1.5)
                time.sleep(wait)
        if got:
            collected.append(got)
    if not collected:
        return None
    if len(collected) == 1:
        return collected[0]
    return {k: int(round(statistics.median(c[k] for c in collected)))
            for k in DIMENSIONS + ["overall"]}


def load_done(out_path):
    done = set()
    if out_path.exists():
        for line in out_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                done.add(json.loads(line)["id"])
            except Exception:
                continue
    return done


def main():
    ap = argparse.ArgumentParser(description="Grade the proposal corpus with the LLM teacher")
    ap.add_argument("--in", dest="inp", type=str, default=str(Path(__file__).parent / "corpus.jsonl"))
    ap.add_argument("--out", type=str, default=str(Path(__file__).parent / "corpus_graded.jsonl"))
    ap.add_argument("--concurrency", type=int, default=3)
    ap.add_argument("--samples", type=int, default=1, help="self-consistency samples per proposal (median)")
    ap.add_argument("--model", type=str, default=None)
    ap.add_argument("--limit", type=int, default=0, help="grade at most N (0 = all)")
    args = ap.parse_args()

    _load_dotenv_if_needed()
    key, base_url, model = resolve_llm()
    model = args.model or model
    from openai import OpenAI
    client = OpenAI(api_key=key, base_url=base_url)
    logger.info("teacher model=%s base_url=%s samples=%d", model, base_url, args.samples)

    inp = Path(args.inp)
    out_path = Path(args.out)
    if not inp.exists():
        logger.error("input corpus not found: %s", inp); sys.exit(1)

    records = [json.loads(l) for l in inp.read_text(encoding="utf-8", errors="ignore").splitlines() if l.strip()]
    done = load_done(out_path)
    todo = [r for r in records if r["id"] not in done]
    if args.limit:
        todo = todo[:args.limit]
    logger.info("corpus=%d already-graded=%d to-grade=%d", len(records), len(done), len(todo))
    if not todo:
        logger.info("nothing to grade."); return

    lock = threading.Lock()
    state = {"n": 0, "fail": 0}
    start = time.time()

    def work(rec):
        scores = grade_one(client, model, rec["prose"], args.samples)
        if not scores:
            with lock:
                state["fail"] += 1
            return
        rec_out = dict(rec)
        rec_out["scores"] = scores
        rec_out["teacher_model"] = model
        with lock:
            with out_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(rec_out, ensure_ascii=False) + "\n")
            state["n"] += 1
            if state["n"] % 25 == 0:
                logger.info("graded %d/%d (fail %d) %.0fs", state["n"], len(todo), state["fail"], time.time() - start)

    with ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futures = [ex.submit(work, r) for r in todo]
        for fut in as_completed(futures):
            try:
                fut.result()
            except Exception as e:
                logger.warning("worker error: %s", str(e)[:120])

    logger.info("DONE graded=%d fail=%d -> %s (%.0fs)", state["n"], state["fail"], out_path, time.time() - start)

    # Quick label distribution sanity (esp. that weak tiers score low)
    rows = [json.loads(l) for l in out_path.read_text(encoding="utf-8", errors="ignore").splitlines() if l.strip()]
    by_tier = {}
    for r in rows:
        t = r.get("intended_tier")
        by_tier.setdefault(t, []).append(r["scores"]["overall"])
    for t in sorted(by_tier):
        xs = by_tier[t]
        logger.info("intended_tier %s: n=%d mean_overall=%.1f", t, len(xs), sum(xs) / len(xs))


if __name__ == "__main__":
    main()
