package com.fyp.supervision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A registration that has been started but not yet confirmed. No {@link UserAccount}
 * exists for it until the email-ownership OTP is verified, so the email / MMU ID
 * remain free to register while a row sits here unverified.
 */
@Entity
@Table(name = "pending_registration")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "mmu_id", nullable = false, length = 20)
    private String mmuId;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(length = 30)
    private String phone;

    /** BCrypt hash of the chosen password — copied verbatim into UserAccount on verify. */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(length = 200)
    private String specialisation;

    @Column(name = "intake_year")
    private Integer intakeYear;

    @Column(name = "privacy_notice_version", length = 20)
    private String privacyNoticeVersion;

    @Column(name = "terms_accepted_at", nullable = false)
    private LocalDateTime termsAcceptedAt;

    /** SHA-256 hex of the 6-digit code. The raw code is only ever emailed to the user. */
    @Column(name = "otp_hash", nullable = false, length = 64)
    private String otpHash;

    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 0;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "last_sent_at", nullable = false)
    private LocalDateTime lastSentAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
