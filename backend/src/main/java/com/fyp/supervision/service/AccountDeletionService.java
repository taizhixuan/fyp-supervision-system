package com.fyp.supervision.service;

import com.fyp.supervision.entity.AccountDeletionRequest;
import com.fyp.supervision.entity.ChatSession;
import com.fyp.supervision.entity.Notification;
import com.fyp.supervision.entity.PushSubscription;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.DeletionRequestStatus;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AccountDeletionRequestRepository;
import com.fyp.supervision.repository.ChatMemoryRepository;
import com.fyp.supervision.repository.ChatPreferencesRepository;
import com.fyp.supervision.repository.ChatSessionRepository;
import com.fyp.supervision.repository.NotificationRepository;
import com.fyp.supervision.repository.PushSubscriptionRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Handles the PDPA right-of-erasure workflow:
 * student requests deletion → admin approves → anonymise PII while keeping
 * academic records (project, proposal, meeting logs, documents) intact so
 * compliance counts and supervisor history don't break.
 *
 * The reason for anonymisation rather than hard delete: meeting_log has a
 * non-null FK to user_account; orphaning it would either require dropping
 * meeting log rows (loses supervisor's history) or weakening the FK
 * (loses referential safety).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private final AccountDeletionRequestRepository deletionRequestRepository;
    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMemoryRepository chatMemoryRepository;
    private final ChatPreferencesRepository chatPreferencesRepository;
    private final NotificationRepository notificationRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom RNG = new SecureRandom();

    // ---------- Student-side ------------------------------------------------

    @Transactional
    public Map<String, Object> requestDeletion(Long userId, String reason) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        deletionRequestRepository
                .findFirstByUser_UserIdAndStatusOrderByRequestedAtDesc(userId, DeletionRequestStatus.PENDING)
                .ifPresent(existing -> {
                    throw new BadRequestException("You already have a pending deletion request.");
                });

        AccountDeletionRequest request = AccountDeletionRequest.builder()
                .user(user)
                .reason(reason == null ? null : reason.trim())
                .status(DeletionRequestStatus.PENDING)
                .build();
        deletionRequestRepository.save(request);

        notifyAdmins(user, request);
        return toDto(request);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOwnRequest(Long userId) {
        return deletionRequestRepository
                .findFirstByUser_UserIdOrderByRequestedAtDesc(userId)
                .map(this::toDto)
                .orElse(null);
    }

    // ---------- Admin-side --------------------------------------------------

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAll(boolean pendingOnly) {
        List<AccountDeletionRequest> rows = pendingOnly
                ? deletionRequestRepository.findByStatusOrderByRequestedAtDesc(DeletionRequestStatus.PENDING)
                : deletionRequestRepository.findAllByOrderByRequestedAtDesc();
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional
    public Map<String, Object> approve(Long requestId, Long adminUserId, String note) {
        AccountDeletionRequest request = deletionRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found."));
        if (request.getStatus() != DeletionRequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be approved.");
        }

        UserAccount admin = userAccountRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        request.setStatus(DeletionRequestStatus.APPROVED);
        request.setDecidedBy(admin);
        request.setDecidedAt(LocalDateTime.now());
        request.setDecisionNote(note == null ? null : note.trim());

        anonymise(request.getUser());

        request.setStatus(DeletionRequestStatus.COMPLETED);
        request.setCompletedAt(LocalDateTime.now());
        deletionRequestRepository.save(request);

        return toDto(request);
    }

    @Transactional
    public Map<String, Object> reject(Long requestId, Long adminUserId, String note) {
        AccountDeletionRequest request = deletionRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found."));
        if (request.getStatus() != DeletionRequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be rejected.");
        }

        UserAccount admin = userAccountRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        request.setStatus(DeletionRequestStatus.REJECTED);
        request.setDecidedBy(admin);
        request.setDecidedAt(LocalDateTime.now());
        request.setDecisionNote(note == null ? null : note.trim());
        deletionRequestRepository.save(request);

        // Tell the student so they're not left hanging.
        try {
            notificationService.createNotification(
                    request.getUser().getUserId(),
                    "PDPA_DELETION_REJECTED",
                    "Account deletion request declined",
                    note == null || note.isBlank()
                            ? "Your account deletion request was reviewed and could not be approved. Contact your FYP coordinator if you have questions."
                            : "Your account deletion request was declined. Reason: " + note,
                    "/settings"
            );
        } catch (RuntimeException ex) {
            log.warn("Could not notify user {} of rejected deletion request: {}", request.getUser().getUserId(), ex.getMessage());
        }

        return toDto(request);
    }

    // ---------- Anonymisation ----------------------------------------------

    private void anonymise(UserAccount user) {
        Long uid = user.getUserId();

        // 1) Hard-delete chat data — these are personal AI conversations, not academic records.
        List<ChatSession> sessions = chatSessionRepository.findByUser_UserIdOrderByStartedAtDesc(uid);
        if (!sessions.isEmpty()) {
            chatSessionRepository.deleteAll(sessions);
        }
        chatMemoryRepository.findById(uid).ifPresent(chatMemoryRepository::delete);
        chatPreferencesRepository.findById(uid).ifPresent(chatPreferencesRepository::delete);

        // 2) Hard-delete notifications + push subscriptions — they're delivery state, not record.
        notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(uid, org.springframework.data.domain.PageRequest.of(0, 10_000))
                .getContent()
                .forEach(notificationRepository::delete);
        List<PushSubscription> subs = pushSubscriptionRepository.findByUser_UserId(uid);
        if (!subs.isEmpty()) {
            pushSubscriptionRepository.deleteAll(subs);
        }

        // 3) Scrub role-specific profile.
        if (user.getRole() == UserRole.STUDENT) {
            StudentProfile sp = studentProfileRepository.findById(uid).orElse(null);
            if (sp != null) {
                sp.setBio(null);
                sp.setInterests(null);
                sp.setSkills(null);
                sp.setLinkedinUrl(null);
                sp.setGithubUrl(null);
                sp.setPortfolioUrl(null);
                sp.setCgpa(null);
                studentProfileRepository.save(sp);
            }
        } else if (user.getRole() == UserRole.SUPERVISOR) {
            SupervisorProfile sv = supervisorProfileRepository.findById(uid).orElse(null);
            if (sv != null) {
                sv.setBio(null);
                sv.setLinkedinUrl(null);
                sv.setGoogleScholarUrl(null);
                sv.setOfficeLocation(null);
                sv.setOfficeHours(null);
                supervisorProfileRepository.save(sv);
            }
        }

        // 4) Scrub user_account itself. Keep userId + role so FKs to projects /
        //    meeting logs / proposals still resolve, but make the row useless
        //    as PII and lock the account out.
        String token = String.valueOf(uid);
        user.setFullName("Deleted User #" + token);
        user.setEmail("deleted-" + token + "-" + UUID.randomUUID() + "@anonymised.local");
        user.setMmuId("DEL" + token + "-" + Math.abs(RNG.nextInt()));
        user.setPhone(null);
        user.setProfileImagePath(null);
        // New password is a random unguessable string — login is impossible
        // even without setting status, but we set BLOCKED for clarity.
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString() + UUID.randomUUID()));
        user.setStatus(UserStatus.BLOCKED);
        userAccountRepository.save(user);

        log.info("PDPA anonymisation completed for user_id={}", uid);
    }

    // ---------- Plumbing ----------------------------------------------------

    private void notifyAdmins(UserAccount requester, AccountDeletionRequest request) {
        List<UserAccount> admins = userAccountRepository.findByRoleAndStatus(UserRole.SYSTEM_ADMIN, UserStatus.ACTIVE);
        for (UserAccount admin : admins) {
            try {
                notificationService.createNotification(
                        admin.getUserId(),
                        "PDPA_DELETION_REQUEST",
                        "New account deletion request",
                        requester.getFullName() + " (" + requester.getMmuId() + ") has requested account deletion under PDPA.",
                        "/admin/deletion-requests"
                );
            } catch (RuntimeException ex) {
                log.warn("Could not notify admin {} of deletion request {}: {}", admin.getUserId(), request.getRequestId(), ex.getMessage());
            }
        }
    }

    private Map<String, Object> toDto(AccountDeletionRequest r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("requestId", r.getRequestId());
        m.put("status", r.getStatus().name());
        m.put("reason", r.getReason());
        m.put("requestedAt", r.getRequestedAt() == null ? null : r.getRequestedAt().toString());
        m.put("decidedAt", r.getDecidedAt() == null ? null : r.getDecidedAt().toString());
        m.put("decidedBy", r.getDecidedBy() == null ? null : r.getDecidedBy().getFullName());
        m.put("decisionNote", r.getDecisionNote());
        m.put("completedAt", r.getCompletedAt() == null ? null : r.getCompletedAt().toString());
        if (r.getUser() != null) {
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("userId", r.getUser().getUserId());
            u.put("fullName", r.getUser().getFullName());
            u.put("mmuId", r.getUser().getMmuId());
            u.put("email", r.getUser().getEmail());
            u.put("role", r.getUser().getRole().name());
            m.put("user", u);
        }
        return m;
    }
}
