package com.fyp.supervision.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.util.Arrays;

/**
 * Refuses to start the application if JWT_SECRET is still the bundled dev default
 * while running under the `prod` Spring profile, and logs a loud warning if the
 * default is in use under any other profile. Also enforces the HS256 ≥256-bit
 * key-length requirement so a too-short secret fails before the first sign-in
 * attempt instead of during token generation.
 *
 * The dev default constant is intentionally duplicated from application.yml so
 * this check survives a future yaml refactor — accidentally renaming the
 * default without updating this constant just means the warning fires once
 * less often, not that production starts with an unsafe key.
 */
@Slf4j
@Configuration
public class JwtSecretSafetyCheck {

    private static final String DEV_DEFAULT_SECRET =
            "dev-secret-key-must-be-at-least-32-characters-long-for-hs256";

    private static final int MIN_SECRET_BYTES = 32; // 256 bits

    private final String secret;
    private final Environment environment;

    public JwtSecretSafetyCheck(@Value("${app.jwt.secret}") String secret, Environment environment) {
        this.secret = secret;
        this.environment = environment;
    }

    @PostConstruct
    public void verify() {
        boolean isProd = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("prod") || p.equalsIgnoreCase("production"));

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET must be set. Provide via env var or mount a Docker secret as JWT_SECRET_FILE.");
        }

        if (secret.equals(DEV_DEFAULT_SECRET)) {
            String msg = "JWT_SECRET is still the bundled dev default. Generate a unique value with"
                    + " `openssl rand -base64 48` and set it via JWT_SECRET (or JWT_SECRET_FILE) before"
                    + " exposing this instance.";
            if (isProd) {
                throw new IllegalStateException(msg);
            }
            log.warn("[security] {}", msg);
        }

        if (secret.getBytes().length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET is too short — HS256 requires at least " + MIN_SECRET_BYTES + " bytes.");
        }
    }
}
