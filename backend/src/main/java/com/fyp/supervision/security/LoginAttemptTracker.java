package com.fyp.supervision.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Failed-login throttle keyed by (identifier, client IP), kept in memory.
 *
 * <p>Keying on the pair rather than the account means someone hammering an account
 * from one IP only locks themselves out, not the real user signing in elsewhere, and
 * it treats unknown identifiers exactly like real ones, so the "try again later"
 * response can't be used to discover which accounts exist. The account-wide lockout
 * in AuthService stays as a much higher backstop against guessing spread over many IPs.
 */
@Component
public class LoginAttemptTracker {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK_WINDOW = Duration.ofMinutes(15);

    private record Entry(int failures, Instant lockedUntil, Instant lastFailure) {}

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    private static String key(String identifier, String ip) {
        return (identifier == null ? "" : identifier.trim().toLowerCase()) + "|" + (ip == null ? "unknown" : ip);
    }

    /** Time left on a lock for this identifier from this IP, if one is active. */
    public Optional<Duration> lockRemaining(String identifier, String ip) {
        Entry e = entries.get(key(identifier, ip));
        if (e == null || e.lockedUntil() == null) return Optional.empty();
        Duration left = Duration.between(Instant.now(), e.lockedUntil());
        return left.isNegative() || left.isZero() ? Optional.empty() : Optional.of(left);
    }

    public void recordFailure(String identifier, String ip) {
        Instant now = Instant.now();
        entries.compute(key(identifier, ip), (k, e) -> {
            // Failures older than the window don't count toward a new lock.
            int prior = (e == null || e.lastFailure().isBefore(now.minus(LOCK_WINDOW))) ? 0 : e.failures();
            int failures = prior + 1;
            if (failures >= MAX_FAILURES) {
                return new Entry(0, now.plus(LOCK_WINDOW), now);
            }
            return new Entry(failures, null, now);
        });
    }

    public void reset(String identifier, String ip) {
        entries.remove(key(identifier, ip));
    }

    /** Drop entries with no active lock and no recent failure so the map can't grow forever. */
    @Scheduled(fixedDelay = 600_000)
    public void evictStale() {
        Instant cutoff = Instant.now().minus(LOCK_WINDOW);
        entries.entrySet().removeIf(en -> {
            Entry e = en.getValue();
            boolean lockOver = e.lockedUntil() == null || e.lockedUntil().isBefore(Instant.now());
            return lockOver && e.lastFailure().isBefore(cutoff);
        });
    }

    int size() {
        return entries.size();
    }
}
