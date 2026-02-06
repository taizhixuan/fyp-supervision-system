package com.fyp.supervision.entity;

import com.fyp.supervision.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "project")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Long projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private FypCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id")
    private UserAccount student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_user_id")
    private UserAccount supervisor;

    @Column(name = "project_title", nullable = false, length = 500)
    private String projectTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String specialisation;

    @Column(length = 100)
    private String category;

    @Column(length = 50)
    private String stage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
        if (status == null) status = ProjectStatus.ACTIVE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
