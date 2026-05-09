package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "deadline_reminder_log")
@IdClass(DeadlineReminderLog.PK.class)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeadlineReminderLog {

    @Id
    @Column(name = "deadline_id")
    private Long deadlineId;

    @Id
    @Column(name = "days_before")
    private Integer daysBefore;

    @Column(name = "fired_at", nullable = false)
    private LocalDateTime firedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PK implements Serializable {
        private Long deadlineId;
        private Integer daysBefore;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(deadlineId, pk.deadlineId)
                    && Objects.equals(daysBefore, pk.daysBefore);
        }

        @Override
        public int hashCode() {
            return Objects.hash(deadlineId, daysBefore);
        }
    }
}
