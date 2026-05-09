package com.fyp.supervision.exception;

/**
 * 403 Forbidden with a custom user-facing message — used for operation-level access checks
 * (e.g. cycle-ended read-only enforcement) that need to surface a specific reason.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
