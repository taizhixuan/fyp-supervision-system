"""
generate_fig4.py

Generates fig4-ai-response-time.png for the IEEE conference paper.

Plots median and 95th percentile response time for the three AI
services in the FYP Supervision System against the 10-second NFR5
budget shown as a dashed horizontal line.

Source: Table II in ieee_conference_paper_v2.md (20 samples per
service, seeded development stack, Intel i7 / 16 GB RAM, no GPU).

Run from this folder:
    python generate_fig4.py

Output:
    fig4-ai-response-time.png  (in the current working directory)

Requires:
    matplotlib >= 3.7

Install with:
    pip install matplotlib
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


# Data from Table II
SERVICES = ["Supervisor\nRecommender", "Proposal\nAnalyser", "Chatbot"]
MEDIAN = [6.8, 7.4, 3.1]
P95 = [8.4, 9.2, 4.3]
BUDGET_SECONDS = 10.0  # NFR5: AI services return within 10 s


def main():
    fig, ax = plt.subplots(figsize=(5.0, 3.5), dpi=300)

    x = np.arange(len(SERVICES))
    width = 0.35

    bars_med = ax.bar(
        x - width / 2,
        MEDIAN,
        width,
        label="Median",
        color="#4472C4",
        edgecolor="black",
        linewidth=0.5,
    )
    bars_p95 = ax.bar(
        x + width / 2,
        P95,
        width,
        label="95th percentile",
        color="#ED7D31",
        edgecolor="black",
        linewidth=0.5,
    )

    ax.axhline(
        y=BUDGET_SECONDS,
        color="crimson",
        linestyle="--",
        linewidth=1.2,
        label="10 s NFR5 budget",
    )

    # Value labels on top of each bar
    for bar_group in (bars_med, bars_p95):
        for bar in bar_group:
            height = bar.get_height()
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                height + 0.18,
                f"{height:.1f}",
                ha="center",
                va="bottom",
                fontsize=8,
            )

    ax.set_ylabel("Response time (seconds)", fontsize=10)
    ax.set_xticks(x)
    ax.set_xticklabels(SERVICES, fontsize=9)
    ax.set_ylim(0, 11.5)
    ax.set_yticks(np.arange(0, 12, 2))
    ax.legend(loc="upper right", fontsize=8, frameon=True)
    ax.grid(axis="y", linestyle=":", alpha=0.5)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()

    output_path = Path(__file__).parent / "fig4-ai-response-time.png"
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    main()
