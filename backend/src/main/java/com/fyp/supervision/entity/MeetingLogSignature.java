package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_log_signature")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MeetingLogSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "signature_id")
    private Long signatureId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_id", nullable = false)
    private MeetingLog meetingLog;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signer_user_id", nullable = false)
    private UserAccount signer;

    @Column(name = "signer_role", nullable = false, length = 20)
    private String signerRole;

    @Column(name = "signature_image_url", columnDefinition = "TEXT")
    private String signatureImageUrl;

    @Column(name = "signature_sha256", length = 64)
    private String signatureSha256;

    @Column(name = "signed_at", nullable = false)
    private LocalDateTime signedAt;

    @PrePersist
    protected void onCreate() {
        signedAt = LocalDateTime.now();
    }
}
