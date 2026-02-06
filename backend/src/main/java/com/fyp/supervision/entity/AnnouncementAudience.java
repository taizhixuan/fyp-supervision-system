package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "announcement_audience")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnnouncementAudience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audience_id")
    private Long audienceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_supervisor_user_id")
    private UserAccount targetSupervisor;
}
