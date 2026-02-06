package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "supervisor_profile")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SupervisorProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @Column(length = 200)
    private String department;

    @Column(length = 200)
    private String faculty;

    @Column(length = 100)
    private String position;

    @Column(name = "research_areas", columnDefinition = "TEXT")
    private String researchAreas;

    @Column(columnDefinition = "TEXT")
    private String expertise;

    @Column(name = "supervision_quota", nullable = false)
    @Builder.Default
    private Integer supervisionQuota = 8;

    @Column(name = "current_load", nullable = false)
    @Builder.Default
    private Integer currentLoad = 0;

    @Column(name = "availability_status", length = 30)
    @Builder.Default
    private String availabilityStatus = "AVAILABLE";

    @Column(name = "preferred_project_types", columnDefinition = "TEXT")
    private String preferredProjectTypes;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "office_location", length = 300)
    private String officeLocation;

    @Column(name = "office_hours", length = 300)
    private String officeHours;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "google_scholar_url", length = 500)
    private String googleScholarUrl;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
