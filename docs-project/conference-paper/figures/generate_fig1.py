"""
generate_fig1.py

Generates fig1-system-architecture.png for the IEEE conference paper.

Layered architecture diagram showing the React client, the Spring
Boot application server, the three Flask AI services and the MySQL
database, with the ports each component listens on.
"""

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


CLIENT_COLOR = "#DCE9F8"
APP_COLOR = "#FFF2CC"
AI_COLOR = "#FBE5D6"
DB_COLOR = "#E2EFDA"
EDGE = "#1f1f1f"


def add_box(ax, x, y, w, h, text, color, fontsize=9):
    box = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.08,rounding_size=0.12",
        linewidth=1.2,
        edgecolor=EDGE,
        facecolor=color,
    )
    ax.add_patch(box)
    ax.text(
        x + w / 2,
        y + h / 2,
        text,
        ha="center",
        va="center",
        fontsize=fontsize,
    )


def add_arrow(ax, x1, y1, x2, y2, label="", offset=(0.0, 0.0), fontsize=7.5):
    arrow = FancyArrowPatch(
        (x1, y1),
        (x2, y2),
        arrowstyle="-|>",
        mutation_scale=12,
        color=EDGE,
        linewidth=1.0,
    )
    ax.add_patch(arrow)
    if label:
        ax.text(
            (x1 + x2) / 2 + offset[0],
            (y1 + y2) / 2 + offset[1],
            label,
            ha="center",
            va="center",
            fontsize=fontsize,
            style="italic",
        )


def main():
    fig, ax = plt.subplots(figsize=(8.5, 5.5), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 11)
    ax.axis("off")

    # Client tier (top, centered on left column)
    add_box(ax, 2, 9.0, 5, 1.1,
            "React 18 SPA  (Vite, TypeScript)\nNginx in prod, port 3000  /  dev 5173",
            CLIENT_COLOR)

    # Application tier (middle, left column)
    add_box(ax, 2, 5.5, 5, 1.6,
            "Spring Boot 3.2  on Java 17\n47 controllers, 24 services\nport 8080",
            APP_COLOR)

    # AI services (stacked vertically on the right)
    add_box(ax, 8.5, 7.5, 5.0, 1.0,
            "AI Service 1   Sentence-BERT (BGE-base)\nSupervisor Recommender, port 5001",
            AI_COLOR, fontsize=8.5)
    add_box(ax, 8.5, 5.9, 5.0, 1.0,
            "AI Service 2   DistilBERT + rule-based NLP\nProposal Analyser, port 5002",
            AI_COLOR, fontsize=8.5)
    add_box(ax, 8.5, 4.3, 5.0, 1.0,
            "AI Service 3   FAISS + remote LLM\nRAG Chatbot, port 5003",
            AI_COLOR, fontsize=8.5)

    # Database tier (bottom, left column)
    add_box(ax, 2, 1.8, 5, 1.1,
            "MySQL 8.4   Flyway-managed schema\nport 3306  (host 3307 in dev)",
            DB_COLOR)

    # Vertical arrows in the left column
    add_arrow(ax, 4.5, 9.0, 4.5, 7.1, "HTTPS / JSON", offset=(1.0, 0.0))
    add_arrow(ax, 4.5, 5.5, 4.5, 2.9, "JDBC", offset=(0.5, 0.0))

    # Horizontal arrows from Spring Boot to each AI service
    add_arrow(ax, 7.0, 6.7, 8.5, 8.0, "HTTP", offset=(0.0, 0.15))
    add_arrow(ax, 7.0, 6.3, 8.5, 6.4, "HTTP", offset=(0.0, 0.15))
    add_arrow(ax, 7.0, 5.9, 8.5, 4.8, "HTTP", offset=(0.0, -0.15))

    plt.tight_layout()
    output = Path(__file__).parent / "fig1-system-architecture.png"
    plt.savefig(output, dpi=300, bbox_inches="tight")
    print(f"Saved: {output}")


if __name__ == "__main__":
    main()
