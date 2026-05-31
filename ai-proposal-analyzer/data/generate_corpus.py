"""
Synthetic FYP-proposal corpus generator (training-data tooling, offline).

Why this exists
---------------
The quality model (`models/essay_scorer/`) is fine-tuned on ASAP — US grade 7-10
school essays — which is the wrong genre for technical CS final-year-project
proposals. To distil a *domain-appropriate* scorer (Route 2) we need a corpus of
CS proposals spanning the full quality spectrum. This script generates that
corpus with the same remote LLM already wired into the analyzer (Groq Llama 3.3
70B by default), in the EXACT prose format the backend sends at inference time
(`StudentProposalController.buildAnalyzerProse`), so training matches deployment.

The intended quality *tier* is only a generation control to guarantee spread.
The real training label is produced separately by `grade_corpus.py` (the teacher
grades each proposal on the system's 5 dimensions). Keep generation and grading
separate so the grader does not see the intended tier and inflate its own labels.

Output
------
`data/corpus.jsonl` — one JSON object per line:
    {
      "id": "<sha1 of prose>",
      "intended_tier": 1..5,
      "topic": "...", "domain": "...", "project_type": "...",
      "fields": { title, problemStatement, objectives[], methodology, scope,
                  expectedOutcomes[], timeline },
      "prose": "<assembled buildAnalyzerProse blob>"
    }

The file is append-only and resumable: re-running tops up toward --count and
skips proposals whose title was already produced.

Usage
-----
    cd ai-proposal-analyzer
    .\\venv\\Scripts\\Activate.ps1
    python data/generate_corpus.py --count 2000

The Groq key is read from the environment, or auto-loaded from the project
`.env` (GROQ_API_KEY / OPENAI_API_KEY / LLM_API_KEY — first match wins), the same
precedence app.py uses.
"""

import os
import re
import sys
import json
import time
import random
import hashlib
import argparse
import logging
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("generate_corpus")

# ---------------------------------------------------------------------------
# Env / LLM config (mirrors app.py precedence: LLM_API_KEY > GROQ > OPENAI)
# ---------------------------------------------------------------------------

GROQ_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1"
OPENAI_DEFAULT_MODEL = "gpt-4o-mini"


def _load_dotenv_if_needed():
    """Populate os.environ from the nearest .env (project root) without
    overwriting anything already set. Tiny parser — no python-dotenv dependency."""
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
                key, _, val = line.partition("=")
                key, val = key.strip(), val.strip().strip('"').strip("'")
                if key and val and not os.environ.get(key):
                    os.environ[key] = val
            return


def _env(name, default=None):
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return raw


def resolve_llm():
    """Return (api_key, base_url, model). Exits if nothing is configured."""
    key = _env("LLM_API_KEY")
    if key:
        return key, _env("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL), _env("LLM_MODEL", GROQ_DEFAULT_MODEL)
    key = _env("GROQ_API_KEY")
    if key:
        return key, _env("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL), _env("LLM_MODEL", GROQ_DEFAULT_MODEL)
    key = _env("OPENAI_API_KEY")
    if key:
        return key, _env("LLM_BASE_URL", OPENAI_DEFAULT_BASE_URL), _env("LLM_MODEL", OPENAI_DEFAULT_MODEL)
    logger.error("No LLM key found (set GROQ_API_KEY / OPENAI_API_KEY / LLM_API_KEY or add to .env).")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Diversity space
# ---------------------------------------------------------------------------

TOPICS = [
    "machine learning classification", "deep learning computer vision",
    "natural language processing", "recommender systems", "speech recognition",
    "network intrusion detection", "web application security", "malware analysis",
    "responsive web platform", "progressive web app", "mobile cross-platform app",
    "Android native app", "IoT sensor network", "smart home automation",
    "edge computing", "cloud-native microservices", "DevOps CI/CD automation",
    "big data analytics pipeline", "business intelligence dashboard",
    "time-series forecasting", "blockchain smart contracts",
    "augmented reality application", "virtual reality training simulation",
    "2D/3D game development", "serious games for learning",
    "healthcare informatics system", "telemedicine platform",
    "e-learning management system", "fintech payment system",
    "fraud detection system", "e-commerce recommendation engine",
    "chatbot / conversational agent", "knowledge graph search",
    "image segmentation", "object detection", "sentiment analysis",
    "database query optimization", "distributed systems consensus",
    "robotic process automation", "embedded firmware", "wireless sensor analytics",
    "data visualization tool", "GIS mapping application",
    "facial recognition attendance", "OCR document processing",
]

DOMAINS = [
    "healthcare", "education", "agriculture", "finance", "retail",
    "transportation", "manufacturing", "smart city", "environment / sustainability",
    "public safety", "tourism", "logistics", "human resources", "energy",
    "social media", "e-government", "small business", "sports", "real estate",
]

PROJECT_TYPES = [
    "build a working system / prototype",
    "comparative study of techniques with evaluation",
    "optimisation of an existing approach",
    "detection / classification model with a deployable interface",
    "prediction / forecasting model with a dashboard",
    "automation tool that replaces a manual process",
    "mobile application with a backend",
    "web platform with analytics",
]

# Tier specs: description steers the LLM; band is only stored as a sanity hint.
TIERS = {
    1: {
        "name": "very weak",
        "band": "10-30",
        "guidance": (
            "Very weak first-draft quality. Vague one-or-two-sentence sections; no real "
            "problem grounding; objectives are generic ('make a system'); methodology is "
            "absent or just 'I will use Python'; scope undefined or wildly unrealistic; "
            "no awareness of any existing work; may stuff buzzwords ('novel','AI-powered') "
            "with nothing behind them; weak grammar; little technical specificity."
        ),
    },
    2: {
        "name": "developing",
        "band": "30-50",
        "guidance": (
            "Developing/below-average. Sections present but shallow and generic; problem "
            "stated but not justified with a real gap; objectives vague or not measurable; "
            "methodology named but not explained (e.g. 'agile' with no detail); scope too "
            "broad or too narrow; minimal mention of related work; modest technical depth."
        ),
    },
    3: {
        "name": "competent",
        "band": "50-70",
        "guidance": (
            "Competent/average passing proposal. All sections coherent; a reasonable but "
            "somewhat generic problem and methodology; objectives mostly clear; scope "
            "defined; some awareness of existing approaches; plausible timeline; adequate "
            "but not standout technical depth; little explicit novelty."
        ),
    },
    4: {
        "name": "strong",
        "band": "70-88",
        "guidance": (
            "Strong proposal. Specific problem grounded in a concrete gap; SMART, measurable "
            "objectives; methodology names concrete techniques, tools, datasets and an "
            "evaluation plan with metrics; well-bounded scope with explicit exclusions; "
            "clear positioning against existing work; realistic phased timeline; good "
            "technical depth and feasibility."
        ),
    },
    5: {
        "name": "excellent",
        "band": "88-100",
        "guidance": (
            "Excellent, distinction-level. Everything in 'strong' plus crisp academic "
            "writing, quantified success criteria and baselines, explicit novelty/contribution, "
            "risk awareness and mitigation, ethical/feasibility considerations, and a tightly "
            "scoped, clearly achievable plan. Reads like a top final-year student wrote it."
        ),
    },
}

DEFAULT_TIER_DIST = {1: 0.12, 2: 0.20, 3: 0.30, 4: 0.25, 5: 0.13}


# ---------------------------------------------------------------------------
# Prompting
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You generate SYNTHETIC training data: realistic Final-Year-Project (FYP) "
    "proposals as written by undergraduate Computer Science students at a Malaysian "
    "university (MMU FCI). You will be asked to produce proposals at a SPECIFIED "
    "quality level and must make the writing genuinely match that level — a weak "
    "proposal must actually read as weak, a strong one as strong. Each proposal must "
    "be self-contained and distinct. Output ONLY a JSON array, no prose, no code "
    "fences, no commentary."
)


def build_user_prompt(specs):
    """specs: list of dicts {tier, topic, domain, project_type}. Returns the user
    message asking for a JSON array of len(specs) distinct proposals."""
    lines = [
        f"Produce a JSON array of exactly {len(specs)} DISTINCT FYP proposals.",
        "Each array element is an object with these keys exactly:",
        '  "title": string (a concrete project title)',
        '  "problemStatement": string',
        '  "objectives": array of strings (each a single objective)',
        '  "methodology": string',
        '  "scope": string',
        '  "expectedOutcomes": array of strings',
        '  "timeline": string  (may be "" for weaker proposals that omit it)',
        "",
        "Make each proposal match its target quality level FAITHFULLY. Vary sentence "
        "structure and vocabulary between proposals; do NOT reuse template phrasing. "
        "Do NOT mention the quality level, tier, or these instructions anywhere in the "
        "proposal text. Write only what a real student would put in the form.",
        "",
        "Proposals to write:",
    ]
    for i, s in enumerate(specs, 1):
        tier = TIERS[s["tier"]]
        lines.append(
            f"{i}. Quality level = {tier['name'].upper()}. "
            f"Topic area: {s['topic']}. Application domain: {s['domain']}. "
            f"Project type: {s['project_type']}.\n"
            f"   Quality guidance: {tier['guidance']}"
        )
    return "\n".join(lines)


def assemble_prose(fields):
    """Reproduce StudentProposalController.buildAnalyzerProse EXACTLY so training
    input matches inference input: 'Label:\\n<value>\\n\\n', objectives/outcomes
    as a numbered list, blank fields skipped, trailing whitespace trimmed."""
    sb = []

    def block(label, value):
        if value and str(value).strip():
            sb.append(f"{label}:\n{str(value).strip()}\n\n")

    def numbered(label, items):
        if isinstance(items, list):
            clean = [str(x).strip() for x in items if str(x).strip()]
            if clean:
                sb.append(f"{label}:\n" + "".join(f"{i}. {v}\n" for i, v in enumerate(clean, 1)) + "\n")

    block("Title", fields.get("title"))
    block("Problem Statement", fields.get("problemStatement"))
    numbered("Objectives", fields.get("objectives"))
    block("Methodology", fields.get("methodology"))
    block("Scope", fields.get("scope"))
    numbered("Expected Outcomes", fields.get("expectedOutcomes"))
    block("Timeline", fields.get("timeline"))
    return "".join(sb).strip()


# ---------------------------------------------------------------------------
# JSON extraction (tolerant — providers wrap arrays in fences / prose)
# ---------------------------------------------------------------------------

def extract_json_array(raw):
    if not raw:
        return None
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    if "[" in text and "]" in text:
        text = text[text.index("["): text.rindex("]") + 1]
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else None
    except json.JSONDecodeError:
        return None


REQUIRED_KEYS = ("title", "problemStatement", "objectives", "methodology", "scope", "expectedOutcomes")


def valid_proposal(obj):
    if not isinstance(obj, dict):
        return False
    for k in REQUIRED_KEYS:
        if k not in obj:
            return False
    if not str(obj.get("title", "")).strip():
        return False
    # objectives/outcomes should be lists; coerce strings to single-item lists later
    return True


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

def make_plan(count, tier_dist, seed=42):
    """Build a list of per-proposal specs covering the tier distribution with
    randomized topic/domain/type so the corpus spans the space."""
    rng = random.Random(seed)
    plan = []
    for tier, frac in tier_dist.items():
        n = round(count * frac)
        for _ in range(n):
            plan.append({
                "tier": tier,
                "topic": rng.choice(TOPICS),
                "domain": rng.choice(DOMAINS),
                "project_type": rng.choice(PROJECT_TYPES),
            })
    rng.shuffle(plan)
    return plan


def chunk(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def call_llm(client, model, specs, max_retries=4):
    """One LLM call -> list of validated proposal dicts (intended specs attached)."""
    user = build_user_prompt(specs)
    delay = 3.0
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user},
                ],
                temperature=0.95,
                max_tokens=4096,
            )
            raw = (resp.choices[0].message.content or "").strip()
            arr = extract_json_array(raw)
            if not arr:
                raise ValueError("no JSON array in response")
            out = []
            for spec, obj in zip(specs, arr):
                if not valid_proposal(obj):
                    continue
                # Coerce objective/outcome strings to lists
                for k in ("objectives", "expectedOutcomes"):
                    v = obj.get(k)
                    if isinstance(v, str):
                        obj[k] = [v] if v.strip() else []
                    elif not isinstance(v, list):
                        obj[k] = []
                out.append((spec, obj))
            return out
        except Exception as e:  # network / rate-limit / parse
            msg = str(e)
            is_rate = "429" in msg or "rate" in msg.lower()
            if attempt == max_retries:
                logger.warning("call failed after %d attempts: %s", attempt, msg[:160])
                return []
            wait = delay * (2 ** (attempt - 1)) + random.uniform(0, 1.5)
            logger.info("retry %d/%d in %.1fs (%s)", attempt, max_retries, wait, "rate-limit" if is_rate else "error")
            time.sleep(wait)
    return []


def load_existing(out_path):
    """Resume support: return (set of seen title-keys, current count)."""
    seen, n = set(), 0
    if out_path.exists():
        for line in out_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                rec = json.loads(line)
                t = rec.get("fields", {}).get("title", "").strip().lower()
                if t:
                    seen.add(t)
                n += 1
            except Exception:
                continue
    return seen, n


def main():
    ap = argparse.ArgumentParser(description="Generate a CS FYP proposal corpus for distillation")
    ap.add_argument("--count", type=int, default=2000, help="target total proposals")
    ap.add_argument("--out", type=str, default=str(Path(__file__).parent / "corpus.jsonl"))
    ap.add_argument("--per-call", type=int, default=4, help="proposals requested per LLM call")
    ap.add_argument("--concurrency", type=int, default=4, help="parallel LLM calls")
    ap.add_argument("--model", type=str, default=None, help="override model id")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    _load_dotenv_if_needed()
    key, base_url, model = resolve_llm()
    model = args.model or model
    try:
        from openai import OpenAI
    except ImportError:
        logger.error("openai package not installed in this venv. pip install -r requirements.txt")
        sys.exit(1)
    client = OpenAI(api_key=key, base_url=base_url)
    logger.info("LLM: model=%s base_url=%s", model, base_url)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    seen, have = load_existing(out_path)
    remaining = max(0, args.count - have)
    logger.info("have %d, target %d -> generating %d more", have, args.count, remaining)
    if remaining == 0:
        logger.info("nothing to do.")
        return

    # Over-plan ~15% to absorb dropped/duplicate proposals.
    plan = make_plan(int(remaining * 1.15) + args.per_call, DEFAULT_TIER_DIST, seed=args.seed + have)
    batches = list(chunk(plan, args.per_call))

    write_lock = threading.Lock()
    counter = {"n": have, "written": 0}
    target = args.count

    def handle(batch):
        if counter["n"] >= target:
            return 0
        results = call_llm(client, model, batch)
        wrote = 0
        with write_lock:
            if counter["n"] >= target:
                return 0
            with out_path.open("a", encoding="utf-8") as f:
                for spec, obj in results:
                    if counter["n"] >= target:
                        break
                    tkey = str(obj.get("title", "")).strip().lower()
                    if not tkey or tkey in seen:
                        continue
                    seen.add(tkey)
                    prose = assemble_prose(obj)
                    if len(prose) < 60:  # guard against empty/degenerate
                        continue
                    rec = {
                        "id": hashlib.sha1(prose.encode("utf-8")).hexdigest()[:16],
                        "intended_tier": spec["tier"],
                        "topic": spec["topic"],
                        "domain": spec["domain"],
                        "project_type": spec["project_type"],
                        "fields": {
                            "title": obj.get("title", ""),
                            "problemStatement": obj.get("problemStatement", ""),
                            "objectives": obj.get("objectives", []),
                            "methodology": obj.get("methodology", ""),
                            "scope": obj.get("scope", ""),
                            "expectedOutcomes": obj.get("expectedOutcomes", []),
                            "timeline": obj.get("timeline", ""),
                        },
                        "prose": prose,
                    }
                    f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                    counter["n"] += 1
                    counter["written"] += 1
                    wrote += 1
        return wrote

    start = time.time()
    with ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futures = [ex.submit(handle, b) for b in batches]
        done = 0
        for fut in as_completed(futures):
            done += 1
            try:
                fut.result()
            except Exception as e:
                logger.warning("batch error: %s", str(e)[:120])
            if done % 5 == 0 or counter["n"] >= target:
                logger.info("progress: %d/%d proposals (%.0fs)", counter["n"], target, time.time() - start)
            if counter["n"] >= target:
                break

    logger.info("DONE: wrote %d new (total %d) to %s in %.0fs",
                counter["written"], counter["n"], out_path, time.time() - start)
    # Tier breakdown
    tiers = {}
    for line in out_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            tiers[json.loads(line)["intended_tier"]] = tiers.get(json.loads(line)["intended_tier"], 0) + 1
        except Exception:
            pass
    logger.info("tier breakdown: %s", dict(sorted(tiers.items())))


if __name__ == "__main__":
    main()
