# Usability evaluation harness

Selenium driver that reproduces the Chapter 6.4 usability evaluation: it logs
in as each of the four roles against the running stack, walks every task
screen, and saves a screenshot + the page load time per screen.

This produces the **figures and `results.csv`** used in
`docs-project/report/chapter6.md` §6.4. The usability *verdicts* (heuristic
violations, severity) are the evaluator's judgement, written up in the chapter
— the script only captures the screens and timings.

## Prerequisites

- The full stack must be up (frontend :5173, backend :8080, AI :5001-5003):
  `docker-compose up` from the repo root.
- Seeded data (the seed scripts in `scripts/`).
- Python 3.11+ and Selenium 4.6+ (ships Selenium Manager, so no manual
  chromedriver install): `pip install selenium`.

## Run

```powershell
cd scripts/usability
python usability_eval.py            # headless (default)
python usability_eval.py --headed   # watch the browser drive
```

Output lands in `docs-project/report/test-evidence/`:
`fig6-NN-<slug>.png` (21 screens) + `results.csv` (fig, file, role, task,
heuristic focus, auto load time, url). Re-running overwrites the same files,
so the evidence is regenerable on demand.

## Accounts used (seeded)

| Role | Identifier | Password |
|---|---|---|
| Student | `sophia@student.mmu.edu.my` | `Test@123` |
| Supervisor | `tan.weiming@mmu.edu.my` | `Test@123` |
| Committee | `ahmad.razak@mmu.edu.my` | `Test@123` |
| Admin | `admin@mmu.edu.my` | `Admin@123` |

The script forces the light theme and dismisses the PDPA consent modal that
the supervisor/committee/admin accounts see on first login.
