"""
generate_all.py

Regenerates every figure for the IEEE conference paper in one run.

Run from this folder (or anywhere, the scripts resolve their own
output paths):

    python generate_all.py

Use the CPython 3.12 venv that ships with the AI services, not the
MSYS2 Python:

    E:\\FYP\\fyp-supervision-system\\ai-recommendation\\venv\\Scripts\\python.exe generate_all.py
"""

import importlib
import sys
import time
from pathlib import Path


SCRIPTS = [
    "generate_fig1",
    "generate_fig2",
    "generate_fig3",
    "generate_fig4",
    "generate_fig5",
]


def main():
    figures_dir = Path(__file__).parent
    # Make sibling modules importable when running from another cwd
    sys.path.insert(0, str(figures_dir))

    total_start = time.perf_counter()
    failures = []

    for name in SCRIPTS:
        start = time.perf_counter()
        try:
            module = importlib.import_module(name)
            # Re-import in case the module was already cached and edited
            module = importlib.reload(module)
            module.main()
            elapsed = time.perf_counter() - start
            print(f"  ({elapsed:.2f}s)")
        except Exception as exc:
            failures.append((name, exc))
            print(f"FAILED: {name} -> {exc}")

    total_elapsed = time.perf_counter() - total_start
    print()
    print(f"Generated {len(SCRIPTS) - len(failures)} / {len(SCRIPTS)} figures "
          f"in {total_elapsed:.2f}s")

    if failures:
        print("Failures:")
        for name, exc in failures:
            print(f"  {name}: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
