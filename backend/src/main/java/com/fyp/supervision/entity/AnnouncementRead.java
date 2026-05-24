package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "announcement_read")
@IdClass(AnnouncementRead.Id.class)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnnouncementRead {

    @jakarta.persistence.Id
    @Column(name = "user_id")
    private Long userId;

    @jakarta.persistence.Id
    @Column(name = "announcement_id")
    private Long announcementId;

    @Column(name = "read_at", nullable = false)
    private LocalDateTime readAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", insertable = false, updatable = false)
    private Announcement announcement;

    @PrePersist
    void onCreate() {
        if (readAt == null) readAt = LocalDateTime.now();
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Id implements Serializable {
        private Long userId;
        private Long announcementId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id id)) return false;
            return Objects.equals(userId, id.userId) && Objects.equals(announcementId, id.announcementId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, announcementId);
        }
    }
}
