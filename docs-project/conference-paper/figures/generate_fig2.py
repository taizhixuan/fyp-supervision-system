"""
generate_fig2.py

Generates fig2-cycle-lifecycle.png for the IEEE conference paper.

State machine for the trimester cycle, showing the four states and the
allowed transitions, with the trigger action labelled on each edge.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch


STATE_COLORS = {
    "Planning": "#E2EFDA",
    "Active": "#DCE9F8",
    "Completed": "#FFF2CC",
    "Archived": "#E0E0E0",
}


def main():
    fig, ax = plt.subplots(figsize=(7.5, 3.2), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 4.5)
    ax.axis("off")

    states = [
        (1.5, 2.2, "Planning"),
        (4.2, 2.2, "Active"),
        (7.0, 2.2, "Completed"),
        (9.6, 2.2, "Archived"),
    ]

    radius = 0.8

    # Draw states
    for x, y, name in states:
        circle = mpatches.Circle(
            (x, y),
            radius,
            facecolor=STATE_COLORS[name],
            edgecolor="black",
            linewidth=1.2,
        )
        ax.add_patch(circle)
        ax.text(x, y, name, ha="center", va="center", fontsize=10, weight="bold")

    # Start arrow into Planning
    ax.text(0.1, 2.2, "start", fontsize=8, ha="left", va="center", style="italic")
    start_arrow = FancyArrowPatch(
        (0.55, 2.2),
        (1.5 - radius, 2.2),
        arrowstyle="-|>",
        mutation_scale=14,
        color="black",
        linewidth=1.0,
    )
    ax.add_patch(start_arrow)

    # Forward transitions
    forward = [
        (1.5, 4.2, "admin activates"),
        (4.2, 7.0, "admin completes\n(notifies students,\nflips write gate)"),
        (7.0, 9.6, "admin archives"),
    ]
    for x1, x2, label in forward:
        a = FancyArrowPatch(
            (x1 + radius, 2.2),
            (x2 - radius, 2.2),
            arrowstyle="-|>",
            mutation_scale=16,
            color="black",
            linewidth=1.1,
        )
        ax.add_patch(a)
        ax.text(
            (x1 + x2) / 2,
            2.2 + radius + 0.15,
            label,
            ha="center",
            va="bottom",
            fontsize=8,
            style="italic",
        )

    # Note under Completed/Archived: read-only for students
    ax.text(
        8.3,
        0.9,
        "student writes return 403\nread access preserved",
        ha="center",
        va="center",
        fontsize=7.5,
        style="italic",
        bbox=dict(boxstyle="round,pad=0.25", facecolor="#FFF8E1", edgecolor="gray"),
    )

    # Connect the note to Completed and Archived
    ax.plot([7.0, 7.6], [2.2 - radius, 1.3], "k:", linewidth=0.6)
    ax.plot([9.6, 9.0], [2.2 - radius, 1.3], "k:", linewidth=0.6)

    plt.tight_layout()
    output = Path(__file__).parent / "fig2-cycle-lifecycle.png"
    plt.savefig(output, dpi=300, bbox_inches="tight")
    print(f"Saved: {output}")


if __name__ == "__main__":
    main()
