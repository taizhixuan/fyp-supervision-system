package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_feedback")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DocumentFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Long feedbackId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private ProjectDocument document;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_user_id", nullable = false)
    private UserAccount supervisor;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "annotated_file_path", length = 500)
    private String annotatedFilePath;

    @Column(name = "annotated_file_name")
    private String annotatedFileName;

    @Column(name = "annotated_file_size")
    private Long annotatedFileSize;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
