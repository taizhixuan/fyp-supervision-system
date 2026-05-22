package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resource_document")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResourceDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resource_id")
    private Long resourceId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    private UserAccount uploadedBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private FypCycle cycle;

    @Column(length = 100)
    private String category;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(length = 30)
    private String visibility;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        publishedAt = LocalDateTime.now();
    }
}
