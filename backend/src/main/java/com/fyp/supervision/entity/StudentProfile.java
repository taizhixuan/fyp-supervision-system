package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_profile")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @Column(length = 200)
    private String programme;

    @Column(length = 200)
    private String specialisation;

    @Column(length = 200)
    private String faculty;

    @Column(name = "intake_year")
    private Integer intakeYear;

    @Column(name = "expected_graduation", length = 20)
    private String expectedGraduation;

    @Column(precision = 4, scale = 2)
    private BigDecimal cgpa;

    @Column(name = "fyp_status", length = 50)
    private String fypStatus;

    @Column(columnDefinition = "TEXT")
    private String interests;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "github_url", length = 500)
    private String githubUrl;

    @Column(name = "portfolio_url", length = 500)
    private String portfolioUrl;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
