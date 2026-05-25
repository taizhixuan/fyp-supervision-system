package com.fyp.supervision.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_account")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "mmu_id", nullable = false, unique = true, length = 20)
    private String mmuId;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(length = 30)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Column(name = "profile_image_path", length = 500)
    private String profileImagePath;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /** Consecutive failed login attempts. Reset to 0 on successful login. */
    @Column(name = "login_attempts", nullable = false)
    @Builder.Default
    private Integer loginAttempts = 0;

    /** Set when the account is temporarily locked. NULL when not locked. */
    @Column(name = "lockout_until")
    private LocalDateTime lockoutUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** When the user ticked "I agree to the Privacy Notice" — null for pre-V42 seeded accounts. */
    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    /** Which version of the privacy notice they consented to. Lets us re-prompt on material changes. */
    @Column(name = "privacy_notice_version", length = 20)
    private String privacyNoticeVersion;

    @JsonIgnore
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StudentProfile studentProfile;

    @JsonIgnore
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SupervisorProfile supervisorProfile;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = UserStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
