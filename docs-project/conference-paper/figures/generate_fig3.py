"""
generate_fig3.py

Generates fig3-signing-sequence.png for the IEEE conference paper.

Sequence diagram for the meeting log signing flow, with four lifelines
(Student, Backend, Supervisor, DB or DOCX renderer) and the message
exchange that produces a self-verifying DOCX with a SHA-256 footer.
"""

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Rectangle


ACTOR_COLOR = "#DCE9F8"
NOTE_COLOR = "#FFF8E1"


def main():
    fig, ax = plt.subplots(figsize=(7.8, 6.2), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 11)
    ax.axis("off")

    actors = [
        ("Student", 1.5),
        ("Backend\n(Spring Boot)", 4.5),
        ("Supervisor", 7.5),
        ("DB / DOCX\nRenderer", 9.8),
    ]
    actor_y = 9.8

    # Actor boxes and lifelines
    for label, x in actors:
        ax.add_patch(
            Rectangle(
                (x - 0.85, actor_y - 0.3),
                1.7,
                0.7,
                facecolor=ACTOR_COLOR,
                edgecolor="black",
                linewidth=1.0,
            )
        )
        ax.text(x, actor_y + 0.05, label, ha="center", va="center", fontsize=8.5,
                weight="bold")
        ax.plot([x, x], [actor_y - 0.3, 0.6], color="black", linestyle=":",
                linewidth=0.7)

    x_student, x_backend, x_super, x_db = [a[1] for a in actors]

    # Message helper
    def message(x1, x2, y, label, dashed=False):
        style = "-|>"
        ls = "--" if dashed else "-"
        a = FancyArrowPatch(
            (x1, y),
            (x2, y),
            arrowstyle=style,
            mutation_scale=12,
            color="black",
            linewidth=0.9,
            linestyle=ls,
        )
        ax.add_patch(a)
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 0.18, label, ha="center", va="bottom", fontsize=7.5)

    def note(x, y, text):
        ax.text(
            x,
            y,
            text,
            ha="center",
            va="center",
            fontsize=7.5,
            style="italic",
            bbox=dict(boxstyle="round,pad=0.25", facecolor=NOTE_COLOR,
                      edgecolor="gray"),
        )

    # Sequence (top to bottom)
    message(x_student, x_backend, 8.8,
            "1. POST /student/meeting-logs/{id}/sign  (PNG data URL)")
    message(x_backend, x_db, 8.0,
            "2. UPDATE student_signature")
    message(x_super, x_backend, 7.0,
            "3. POST /supervisor/meeting-logs/{id}/sign")
    note(x_backend, 6.1,
         "4. backend computes SHA-256( student || supervisor )")
    message(x_backend, x_db, 5.2,
            "5. UPDATE supervisor_signature, hash")
    message(x_student, x_backend, 4.2,
            "6. GET /student/meeting-logs/{id}/export.docx")
    message(x_backend, x_db, 3.4,
            "7. renderMeetingLogDocx(log)")
    message(x_db, x_backend, 2.5,
            "8. DOCX bytes (signatures embedded, hash in footer)",
            dashed=True)
    message(x_backend, x_student, 1.6,
            "9. application/vnd.openxmlformats-officedocument.wordprocessingml...",
            dashed=True)

    plt.tight_layout()
    output = Path(__file__).parent / "fig3-signing-sequence.png"
    plt.savefig(output, dpi=300, bbox_inches="tight")
    print(f"Saved: {output}")


if __name__ == "__main__":
    main()
