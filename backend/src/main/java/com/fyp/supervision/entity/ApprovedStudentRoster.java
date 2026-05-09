package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "approved_student_roster")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ApprovedStudentRoster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roster_id")
    private Long rosterId;

    @Column(name = "mmu_id", nullable = false, unique = true, length = 20)
    private String mmuId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(length = 200)
    private String programme;

    @Column(length = 200)
    private String specialisation;

    @Column(length = 200)
    private String faculty;

    @Column(name = "intake_year")
    private Integer intakeYear;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private UserAccount uploadedBy;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        uploadedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
