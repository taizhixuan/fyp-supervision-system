package com.fyp.supervision.service;

import com.fyp.supervision.exception.RateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-user, per-scope rate limiting. In-memory (ConcurrentHashMap of buckets) —
 * fine for the current single-instance deployment. To go multi-instance,
 * swap the cache for a Bucket4j Redis-backed proxy without touching callers.
 *
 * Caller pattern (at the top of a protected endpoint):
 *
 *   rateLimitService.require("chat", userId);   // throws 429 if exhausted
 *
 * The bucket for (scope, userId) is sized by the application.yml knobs:
 *   app.rate-limit.chat-per-hour      (default 60)
 *   app.rate-limit.analyze-per-hour   (default 10)
 */
@Service
public class RateLimitService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final MeterRegistry meterRegistry;

    @Value("${app.rate-limit.chat-per-hour:60}")
    private int chatPerHour;

    @Value("${app.rate-limit.analyze-per-hour:10}")
    private int analyzePerHour;

    public RateLimitService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void require(String scope, Long userId) {
        requireKey(scope, String.valueOf(userId));
    }

    /**
     * Same as {@link #require} but keyed by an arbitrary string, for endpoints with no
     * signed-in user (register / OTP / forgot-password are keyed by email and by IP).
     */
    public void requireKey(String scope, String key) {
        Bucket bucket = buckets.computeIfAbsent(scope + ":" + key, k -> newBucket(scope));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            Duration retryAfter = Duration.ofNanos(probe.getNanosToWaitForRefill());
            long seconds = Math.max(1, retryAfter.toSeconds());
            meterRegistry.counter("app_rate_limit_rejections_total", "scope", scope).increment();
            throw new RateLimitExceededException(
                    scope,
                    retryAfter,
                    "You've hit the rate limit for this feature. Try again in " + seconds + " seconds."
            );
        }
    }

    private Bucket newBucket(String scope) {
        int perHour = capacityFor(scope);
        // Token-bucket with refill over a rolling 1-hour window.
        // greedy refill = tokens trickle back continuously rather than in chunks.
        Bandwidth bandwidth = Bandwidth.builder()
                .capacity(perHour)
                .refillGreedy(perHour, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(bandwidth).build();
    }

    /**
     * Buckets are keyed per email / IP / user, so without cleanup the map grows with every
     * address that ever hit an auth endpoint. A bucket that has refilled to capacity holds
     * no state worth keeping (a fresh one is identical), so drop those.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 900_000)
    public void evictIdleBuckets() {
        buckets.entrySet().removeIf(e -> {
            String scope = e.getKey().substring(0, e.getKey().indexOf(':'));
            return e.getValue().getAvailableTokens() >= capacityFor(scope);
        });
    }

    int bucketCount() {
        return buckets.size();
    }

    private int capacityFor(String scope) {
        return switch (scope) {
            case "chat" -> chatPerHour;
            case "analyze" -> analyzePerHour;
            // Unauthenticated auth endpoints. Per-email limits stop mail-bombing one inbox
            // and OTP guessing; per-IP limits are looser because users can share a NAT.
            case "auth-email" -> 6;
            case "auth-ip" -> 60;
            case "otp-verify-ip" -> 60;
            default -> 60; // safe generic default for any new scope added without config
        };
    }

    /** Wipe one user's buckets — call from admin reset flows if added later. Currently unused. */
    public void resetForUser(Long userId) {
        buckets.keySet().removeIf(k -> k.endsWith(":" + userId));
    }
}
