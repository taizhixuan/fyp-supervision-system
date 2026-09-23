package com.fyp.supervision.service;

import com.fyp.supervision.entity.CalendarFeedToken;
import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.CalendarFeedTokenRepository;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Private calendar subscription ("webcal") feed. Each student/supervisor can create one
 * secret URL that Google, Outlook or Apple Calendar polls, so reschedules and
 * cancellations show up without re-importing. Only the SHA-256 of the token is stored,
 * so the full URL is shown once; resetting it invalidates the old URL.
 */
@Service
@RequiredArgsConstructor
public class CalendarFeedService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    /** Feed also keeps recent history so a just-finished meeting doesn't vanish. */
    private static final int HISTORY_DAYS = 60;

    private final CalendarFeedTokenRepository tokenRepository;
    private final UserAccountRepository userAccountRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingCalendarService meetingCalendarService;

    public Map<String, Object> status(Long userId) {
        requireEligible(userId);
        Optional<CalendarFeedToken> token = tokenRepository.findById(userId);
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("enabled", token.isPresent());
        dto.put("createdAt", token.map(t -> t.getCreatedAt().toString()).orElse(null));
        dto.put("lastAccessedAt", token.map(t -> t.getLastAccessedAt() != null ? t.getLastAccessedAt().toString() : null).orElse(null));
        return dto;
    }

    /** Creates or replaces the user's token. The raw token is returned exactly once. */
    @Transactional
    public Map<String, Object> rotate(Long userId) {
        requireEligible(userId);
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        CalendarFeedToken token = tokenRepository.findById(userId).orElseGet(() ->
                CalendarFeedToken.builder().userId(userId).build());
        token.setTokenHash(sha256Hex(raw));
        token.setCreatedAt(LocalDateTime.now());
        token.setLastAccessedAt(null);
        tokenRepository.save(token);

        Map<String, Object> dto = status(userId);
        dto.put("token", raw);
        return dto;
    }

    @Transactional
    public void revoke(Long userId) {
        tokenRepository.findById(userId).ifPresent(tokenRepository::delete);
    }

    /** Public feed body. Unknown / revoked token or inactive account → 404 (no hint either way). */
    @Transactional
    public byte[] feed(String rawToken) {
        if (rawToken == null || rawToken.length() < 20 || rawToken.length() > 100) {
            throw new ResourceNotFoundException("Calendar feed not found");
        }
        CalendarFeedToken token = tokenRepository.findByTokenHash(sha256Hex(rawToken))
                .orElseThrow(() -> new ResourceNotFoundException("Calendar feed not found"));
        UserAccount user = userAccountRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Calendar feed not found"));
        if (user.getStatus() != UserStatus.ACTIVE || !isEligibleRole(user.getRole())) {
            throw new ResourceNotFoundException("Calendar feed not found");
        }
        token.setLastAccessedAt(LocalDateTime.now());
        tokenRepository.save(token);

        List<Meeting> meetings = meetingRepository.findForCalendarFeed(user.getUserId(),
                LocalDateTime.now().minusDays(HISTORY_DAYS));
        return meetingCalendarService.buildFeedBytes(meetings, "FYP Meetings");
    }

    private void requireEligible(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!isEligibleRole(user.getRole())) {
            throw new ForbiddenException("Calendar subscription is available to students and supervisors.");
        }
    }

    private static boolean isEligibleRole(UserRole role) {
        return role == UserRole.STUDENT || role == UserRole.SUPERVISOR;
    }

    static String sha256Hex(String input) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
