package com.fyp.supervision.exception;

import lombok.Getter;

import java.time.Duration;

/**
 * Thrown by RateLimitService when a per-user bucket has no tokens left.
 * Carries the wait-until-refill so the response can include a Retry-After header.
 */
@Getter
public class RateLimitExceededException extends RuntimeException {
    private final Duration retryAfter;
    private final String scope;

    public RateLimitExceededException(String scope, Duration retryAfter, String message) {
        super(message);
        this.scope = scope;
        this.retryAfter = retryAfter;
    }
}
