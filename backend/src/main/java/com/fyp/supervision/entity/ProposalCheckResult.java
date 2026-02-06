package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "proposal_check_result")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProposalCheckResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "check_id")
    private Long checkId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id")
    private ProposalVersion version;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id")
    private Proposal proposal;

    @Column(name = "checked_by")
    private String checkedBy;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "feasibility_score")
    private Integer feasibilityScore;

    @Column(name = "innovation_score")
    private Integer innovationScore;

    @Column(name = "clarity_score")
    private Integer clarityScore;

    @Column(name = "scope_score")
    private Integer scopeScore;

    @Column(name = "issues_summary", columnDefinition = "TEXT")
    private String issuesSummary;

    @Column(name = "missing_sections", columnDefinition = "TEXT")
    private String missingSections;

    @Column(name = "suggested_improvements", columnDefinition = "TEXT")
    private String suggestedImprovements;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "plagiarism_score")
    private Integer plagiarismScore;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt;

    @PrePersist
    protected void onCreate() {
        checkedAt = LocalDateTime.now();
    }
}
