package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One secret calendar-subscription token per user. Only the SHA-256 hash is stored. */
@Entity
@Table(name = "calendar_feed_token")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CalendarFeedToken {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;
}
