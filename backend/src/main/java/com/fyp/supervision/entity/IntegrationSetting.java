package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "integration_setting")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class IntegrationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "integration_id")
    private Long integrationId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "integration_type", length = 50)
    private String integrationType;

    @Column(length = 100)
    private String provider;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "endpoint_url", length = 500)
    private String endpointUrl;

    @Column(name = "settings_json", columnDefinition = "TEXT")
    private String settingsJson;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "last_tested_at")
    private LocalDateTime lastTestedAt;

    @Column(name = "last_test_result", length = 50)
    private String lastTestResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private UserAccount updatedBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
