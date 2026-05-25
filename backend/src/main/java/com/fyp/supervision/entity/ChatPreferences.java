package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Per-student style preferences for the FYP Assistant chatbot. Injected as a
 * style directive in every turn's context so the assistant adapts tone,
 * length, and language to the student's preference.
 */
@Entity
@Table(name = "chat_preferences")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatPreferences {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserAccount user;

    /** SHORT | BALANCED | DETAILED */
    @Column(name = "response_length", nullable = false, length = 20)
    @Builder.Default
    private String responseLength = "BALANCED";

    /** FORMAL | NEUTRAL | CASUAL */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String tone = "NEUTRAL";

    /** EN | MS | ZH | MIXED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String language = "EN";

    /** PDPA consent for sending data to overseas LLM (Groq / OpenAI). Null until asked. */
    @Column(name = "ai_processing_consented")
    private Boolean aiProcessingConsented;

    @Column(name = "ai_consent_decided_at")
    private LocalDateTime aiConsentDecidedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
