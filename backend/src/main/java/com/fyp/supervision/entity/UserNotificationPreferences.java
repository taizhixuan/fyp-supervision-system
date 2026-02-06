package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreferences {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "preferences_json", columnDefinition = "TEXT")
    private String preferencesJson;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
