package com.fyp.supervision.service;

import com.fyp.supervision.entity.AuditLog;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Single entry point for writing rows into {@code audit_log}. Existed as table + entity
 * + repo + admin viewer page for a long time without ever being written to — this fills
 * that gap. Records are best-effort: a failure to log must NEVER break the action being
 * logged, so every public method is REQUIRES_NEW + try/catch and exceptions are
 * swallowed with a WARN.
 *
 * <p>The {@code action} field is a short stable string (e.g. {@code LOGIN_SUCCESS}) so
 * downstream filtering can group by action. Keep new actions in this same SCREAMING_CASE
 * style.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /** Most general entry — pass actor entity if you have it, plus optional request for IP/UA. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UserAccount actor, String action, String entityName, String entityId,
                       String details, HttpServletRequest request) {
        try {
            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .details(truncate(details, 4000))
                    .ipAddress(request != null ? clientIp(request) : null)
                    .userAgent(request != null ? truncate(request.getHeader("User-Agent"), 500) : null)
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Best-effort: never let an audit-write failure cascade into the caller.
            AuditService.log.warn("Audit log write failed for action={}: {}", action, e.getMessage());
        }
    }

    /** Convenience: actor unknown / not yet authenticated (e.g. failed login). */
    public void recordAnonymous(String action, String entityName, String entityId,
                                String details, HttpServletRequest request) {
        record(null, action, entityName, entityId, details, request);
    }

    /** Async wrapper. Fire-and-forget for hot paths where latency matters. */
    @Async
    public void recordAsync(UserAccount actor, String action, String entityName, String entityId,
                            String details, HttpServletRequest request) {
        record(actor, action, entityName, entityId, details, request);
    }

    private static String clientIp(HttpServletRequest req) {
        // Honour X-Forwarded-For when behind a proxy/load balancer; first hop only.
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        return req.getRemoteAddr();
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
