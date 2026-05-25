"""
generate_fig5.py

Generates fig5-committee-dashboard.png for the IEEE conference paper.

Mock-up of the FYP Committee cohort dashboard, showing ten sample
supervisees with their meeting-log compliance progress bars and risk
colouring (green for low risk, amber for medium, red for high). The
real running system shows the same layout for a 37-student cohort.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Patch, Rectangle


RISK_COLORS = {
    "low": "#A9D08E",
    "med": "#FFD966",
    "high": "#F4B084",
}


def main():
    students = [
        ("S001  Tan Wei Ming",        6, "low"),
        ("S002  Lim Jia Hui",         5, "low"),
        ("S003  Wong Kar Yin",        4, "med"),
        ("S004  Lee Wei Liang",       6, "low"),
        ("S005  Chua Mei Ling",       3, "med"),
        ("S006  Ng Boon Hock",        6, "low"),
        ("S007  Goh Xin Yi",          2, "high"),
        ("S008  Ang Su Mei",          4, "med"),
        ("S009  Yap Chen Hao",        5, "low"),
        ("S010  Chia Pei Yi",         1, "high"),
    ]

    names = [s[0] for s in students]
    logs = [s[1] for s in students]
    colors = [RISK_COLORS[s[2]] for s in students]

    fig, ax = plt.subplots(figsize=(7.5, 4.2), dpi=300)
    y_pos = np.arange(len(names))

    bars = ax.barh(
        y_pos,
        logs,
        color=colors,
        edgecolor="black",
        linewidth=0.6,
        height=0.6,
    )

    ax.set_yticks(y_pos)
    ax.set_yticklabels(names, fontsize=9)
    ax.invert_yaxis()
    ax.set_xlim(0, 7.2)
    ax.set_xticks(range(0, 7))
    ax.set_xlabel("Approved meeting logs (FCI requires 6 per phase)",
                  fontsize=9.5)

    ax.axvline(x=6, color="black", linestyle="--", linewidth=1.2, alpha=0.7)
    ax.text(6.05, -0.7, "6-log requirement", fontsize=7.5, style="italic",
            color="black", va="bottom")

    # Annotate bars with their count
    for bar, n in zip(bars, logs):
        ax.text(
            bar.get_width() + 0.12,
            bar.get_y() + bar.get_height() / 2,
            f"{n} / 6",
            va="center",
            fontsize=8.5,
        )

    # Legend (risk colouring)
    legend_handles = [
        Patch(facecolor=RISK_COLORS["low"], edgecolor="black", label="Low risk"),
        Patch(facecolor=RISK_COLORS["med"], edgecolor="black", label="Medium risk"),
        Patch(facecolor=RISK_COLORS["high"], edgecolor="black", label="High risk"),
    ]
    ax.legend(handles=legend_handles, loc="lower right", fontsize=8.5,
              frameon=True)

    # Hide top and right spines
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="x", linestyle=":", alpha=0.4)
    ax.set_axisbelow(True)

    ax.set_title(
        "FYP Committee Dashboard  (FYP2 cohort, sample of 10)",
        fontsize=10.5,
        weight="bold",
        loc="left",
    )

    plt.tight_layout()
    output = Path(__file__).parent / "fig5-committee-dashboard.png"
    plt.savefig(output, dpi=300, bbox_inches="tight")
    print(f"Saved: {output}")


if __name__ == "__main__":
    main()
