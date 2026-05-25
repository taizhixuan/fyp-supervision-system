package com.fyp.supervision.service;

import com.fyp.supervision.exception.RateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
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

    @Value("${app.rate-limit.chat-per-hour:60}")
    private int chatPerHour;

    @Value("${app.rate-limit.analyze-per-hour:10}")
    private int analyzePerHour;

    public void require(String scope, Long userId) {
        Bucket bucket = bucketFor(scope, userId);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            Duration retryAfter = Duration.ofNanos(probe.getNanosToWaitForRefill());
            long seconds = Math.max(1, retryAfter.toSeconds());
            throw new RateLimitExceededException(
                    scope,
                    retryAfter,
                    "You've hit the rate limit for this feature. Try again in " + seconds + " seconds."
            );
        }
    }

    private Bucket bucketFor(String scope, Long userId) {
        String key = scope + ":" + userId;
        return buckets.computeIfAbsent(key, k -> newBucket(scope));
    }

    private Bucket newBucket(String scope) {
        int perHour = switch (scope) {
            case "chat" -> chatPerHour;
            case "analyze" -> analyzePerHour;
            default -> 60; // safe generic default for any new scope added without config
        };
        // Token-bucket with refill over a rolling 1-hour window.
        // greedy refill = tokens trickle back continuously rather than in chunks.
        Bandwidth bandwidth = Bandwidth.builder()
                .capacity(perHour)
                .refillGreedy(perHour, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(bandwidth).build();
    }

    /** Wipe one user's buckets — call from admin reset flows if added later. Currently unused. */
    public void resetForUser(Long userId) {
        buckets.keySet().removeIf(k -> k.endsWith(":" + userId));
    }
}
