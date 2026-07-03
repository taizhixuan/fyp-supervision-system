package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fyp.supervision.enums.MeetingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "meeting")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meeting_id")
    private Long meetingId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    private UserAccount requestedBy;

    @Column(length = 300)
    private String title;

    @Column(name = "meeting_type", length = 50)
    private String meetingType;

    @Column(name = "proposed_start_at")
    private LocalDateTime proposedStartAt;

    @Column(name = "proposed_end_at")
    private LocalDateTime proposedEndAt;

    @Column(name = "confirmed_start_at")
    private LocalDateTime confirmedStartAt;

    @Column(name = "confirmed_end_at")
    private LocalDateTime confirmedEndAt;

    @Column(length = 50)
    private String platform;

    @Column(length = 300)
    private String location;

    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(columnDefinition = "TEXT")
    private String agenda;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MeetingStatus status;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "alternative_datetimes", columnDefinition = "TEXT")
    private String alternativeDatetimes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Set when the meeting-reminder job has notified about this meeting (dedupe).
    @Column(name = "reminder_sent_at")
    private LocalDateTime reminderSentAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = MeetingStatus.PROPOSED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
