package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fyp.supervision.enums.MeetingLogStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meeting_log")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MeetingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id")
    private Meeting meeting;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id", nullable = false)
    private UserAccount student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_user_id", nullable = false)
    private UserAccount supervisor;

    @Column(name = "meeting_date")
    private LocalDate meetingDate;

    @Column(name = "meeting_number")
    private Integer meetingNumber;

    @Column(name = "meeting_mode", length = 20)
    private String meetingMode;

    @Column(name = "fyp_phase", length = 10)
    private String fypPhase;

    @Column(name = "tasks_json", columnDefinition = "TEXT")
    private String tasksJson;

    @Column(name = "discussion_summary", columnDefinition = "TEXT")
    private String discussionSummary;

    @Column(name = "work_done_details", columnDefinition = "TEXT")
    private String workDoneDetails;

    @Column(name = "work_to_be_done", columnDefinition = "TEXT")
    private String workToBeDone;

    @Column(name = "problems_and_solutions", columnDefinition = "TEXT")
    private String problemsAndSolutions;

    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems;

    @Column(name = "next_meeting_date")
    private LocalDate nextMeetingDate;

    @Column(name = "supervisor_comments", columnDefinition = "TEXT")
    private String supervisorComments;

    @Column(name = "correction_reason", columnDefinition = "TEXT")
    private String correctionReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MeetingLogStatus status;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    /** Whole-document SHA-256 fingerprint, frozen when the log locks (both parties signed). */
    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "meetingLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MeetingLogSignature> signatures = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = MeetingLogStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
