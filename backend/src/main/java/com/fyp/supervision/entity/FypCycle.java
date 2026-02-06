package com.fyp.supervision.entity;

import com.fyp.supervision.enums.CycleStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fyp_cycle")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FypCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cycle_id")
    private Long cycleId;

    @Column(name = "cycle_code", nullable = false, unique = true, length = 50)
    private String cycleCode;

    @Column(name = "cycle_type", length = 10)
    private String cycleType;

    @Column(name = "academic_year", length = 20)
    private String academicYear;

    private Integer semester;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CycleStatus status;

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
