package com.fyp.supervision.entity;

import com.fyp.supervision.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "supervisor_request")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SupervisorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id", nullable = false)
    private UserAccount student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_user_id", nullable = false)
    private UserAccount supervisorUser;

    @Column(name = "proposed_title", length = 500)
    private String proposedTitle;

    @Column(name = "topic_summary", columnDefinition = "TEXT")
    private String topicSummary;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "response_message", columnDefinition = "TEXT")
    private String responseMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
        if (status == null) status = RequestStatus.PENDING;
        if (expiresAt == null) expiresAt = submittedAt.plusDays(14);
    }
}
