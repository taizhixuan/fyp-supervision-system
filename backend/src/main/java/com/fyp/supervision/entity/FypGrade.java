package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One grade row per (project, phase, grader). The grader records criterion-level marks
 * in {@code rubricJson}; {@code totalScore} + {@code letterGrade} are derived for fast
 * sorting. Status flow:
 * <ul>
 *   <li>{@code DRAFT} — grader is still working on it; not visible to student</li>
 *   <li>{@code SUBMITTED} — grader has signed off; visible to admin/committee, NOT to student</li>
 *   <li>{@code FINALISED} — admin has locked it; visible to the student on their dashboard</li>
 * </ul>
 */
@Entity
@Table(name = "fyp_grade")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FypGrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grade_id")
    private Long gradeId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 10)
    private String phase;       // FYP1 / FYP2

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grader_user_id", nullable = false)
    private UserAccount grader;

    /** SUPERVISOR / EXAMINER / COMMITTEE — the grader's role at time of submission. */
    @Column(name = "grader_role", nullable = false, length = 20)
    private String graderRole;

    @Column(name = "rubric_json", columnDefinition = "TEXT")
    private String rubricJson;

    @Column(name = "total_score", precision = 5, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "letter_grade", length = 5)
    private String letterGrade;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finalised_by_user_id")
    private UserAccount finalisedBy;

    @Column(name = "finalised_at")
    private LocalDateTime finalisedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "DRAFT";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
