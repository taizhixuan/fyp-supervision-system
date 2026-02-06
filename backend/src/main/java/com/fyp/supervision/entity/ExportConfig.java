package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "export_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Long configId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "data_type", nullable = false, length = 50)
    private String dataType;

    @Column(nullable = false, length = 20)
    private String format;

    @Column(name = "include_headers", nullable = false)
    private Boolean includeHeaders;

    @Column(name = "date_format", length = 50)
    private String dateFormat;

    @Column(name = "fields_json", columnDefinition = "TEXT")
    private String fieldsJson;

    @Column(name = "filters_json", columnDefinition = "TEXT")
    private String filtersJson;

    @Column(name = "schedule_json", columnDefinition = "TEXT")
    private String scheduleJson;

    @Column(name = "last_export_path", length = 500)
    private String lastExportPath;

    @Column(name = "last_export_at")
    private LocalDateTime lastExportAt;

    @Column(name = "created_at", nullable = false)
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
