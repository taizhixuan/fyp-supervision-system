package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deadline")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Deadline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deadline_id")
    private Long deadlineId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private FypCycle cycle;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "deadline_type", length = 50)
    private String deadlineType;

    @Column(length = 50)
    private String audience;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reminder_days", columnDefinition = "TEXT")
    private String reminderDays;

    @Column(name = "is_extendable", nullable = false)
    @Builder.Default
    private Boolean isExtendable = false;

    @Column(name = "extended_date")
    private LocalDate extendedDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
