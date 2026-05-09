package com.fyp.supervision.exception;

/**
 * Thrown when an upstream Flask AI service (chatbot / recommender / analyzer)
 * is unreachable or returns a non-2xx response. Controllers catch this and
 * surface a 503 to the client instead of persisting placeholder content.
 */
public class AiServiceUnavailableException extends RuntimeException {

    public AiServiceUnavailableException(String message) {
        super(message);
    }

    public AiServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
