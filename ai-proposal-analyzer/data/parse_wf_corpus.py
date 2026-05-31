"""
Parse the agent-written delimited corpus files (data/_wf/batch_*.txt) into the
graded JSONL the trainer consumes (same shape as grade_corpus.py output):

    {"id","intended_tier","prose","scores":{clarity,structure,scope,innovation,
      feasibility,overall},"teacher_model"}

The delimited format (one block per proposal) is escaping-free on purpose, so
agents can write multi-paragraph prose without JSON quoting pitfalls:

    <<<RECORD>>>
    TIER: 3
    SCORES: clarity=55 structure=60 scope=50 innovation=45 feasibility=58 overall=53
    PROSE:
    Title:
    ...
    <<<END>>>

Tolerant: malformed/truncated blocks are skipped (we over-provision batches).

Usage:
    python data/parse_wf_corpus.py --wf data/_wf --out data/corpus_graded.jsonl
"""

import re
import json
import hashlib
import argparse
from pathlib import Path
from collections import defaultdict

DIMS = ["clarity", "structure", "scope", "innovation", "feasibility", "overall"]


def parse_record(block):
    tier_m = re.search(r"TIER:\s*([1-5])", block)
    scores_m = re.search(r"SCORES:\s*(.+)", block)
    prose_m = re.search(r"PROSE:\s*\n([\s\S]+)", block)
    if not (tier_m and scores_m and prose_m):
        return None
    scores = {}
    for k in DIMS:
        m = re.search(rf"{k}\s*=\s*(\d{{1,3}})", scores_m.group(1))
        if not m:
            return None
        scores[k] = max(0, min(100, int(m.group(1))))
    prose = prose_m.group(1).strip()
    # strip a trailing <<<END>>> if the regex caught it
    prose = re.split(r"<<<END>>>", prose)[0].strip()
    if len(prose) < 50 or "Title:" not in prose:
        return None
    return {
        "id": hashlib.sha1(prose.encode("utf-8")).hexdigest()[:16],
        "intended_tier": int(tier_m.group(1)),
        "prose": prose,
        "scores": scores,
        "teacher_model": "claude-workflow",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wf", default=str(Path(__file__).parent / "_wf"))
    ap.add_argument("--out", default=str(Path(__file__).parent / "corpus_graded.jsonl"))
    ap.add_argument("--append-from", default="", help="optional existing graded jsonl to merge in")
    args = ap.parse_args()

    wf = Path(args.wf)
    files = sorted(wf.glob("batch_*.txt"))
    print(f"found {len(files)} batch files")

    seen, records = set(), []
    bad_blocks = 0
    for fp in files:
        text = fp.read_text(encoding="utf-8", errors="ignore")
        blocks = text.split("<<<RECORD>>>")
        for b in blocks:
            if "SCORES:" not in b:
                continue
            rec = parse_record(b)
            if not rec:
                bad_blocks += 1
                continue
            if rec["id"] in seen:
                continue
            seen.add(rec["id"])
            records.append(rec)

    if args.append_from and Path(args.append_from).exists():
        for line in Path(args.append_from).read_text(encoding="utf-8").splitlines():
            try:
                rec = json.loads(line)
                if rec.get("id") and rec["id"] not in seen and rec.get("scores"):
                    seen.add(rec["id"])
                    records.append(rec)
            except Exception:
                continue

    out = Path(args.out)
    with out.open("w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"wrote {len(records)} graded proposals to {out} (skipped {bad_blocks} bad blocks)")

    # sanity: weak tiers should average low, strong tiers high
    by_tier = defaultdict(list)
    for r in records:
        by_tier[r["intended_tier"]].append(r["scores"]["overall"])
    for t in sorted(by_tier):
        xs = by_tier[t]
        print(f"  intended_tier {t}: n={len(xs):4d}  mean_overall={sum(xs)/len(xs):5.1f}")
    # overall score spread
    allo = [r["scores"]["overall"] for r in records]
    if allo:
        allo.sort()
        print(f"  overall range: min={allo[0]} p25={allo[len(allo)//4]} "
              f"median={allo[len(allo)//2]} p75={allo[3*len(allo)//4]} max={allo[-1]}")


if __name__ == "__main__":
    main()
