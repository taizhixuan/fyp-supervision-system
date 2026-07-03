package com.fyp.supervision.service;

import com.fyp.supervision.repository.SystemParameterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Reads runtime-tunable values from the system_parameter table so the admin
 * System Parameters screen actually drives behaviour. Every getter is fail-open:
 * a missing key, blank value, or unparseable value returns the supplied default,
 * so a broken or empty row can never take a working feature offline.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemParameterService {

    private final SystemParameterRepository repository;

    public String getString(String key, String defaultValue) {
        try {
            return repository.findByParamKey(key)
                    .map(p -> p.getParamValue())
                    .filter(v -> v != null && !v.isBlank())
                    .orElse(defaultValue);
        } catch (Exception e) {
            log.debug("Parameter lookup failed for {}, using default: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    public int getInt(String key, int defaultValue) {
        String v = getString(key, null);
        if (v == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(v.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /** Accepts true/1/enabled/yes/on (case-insensitive) as true; anything else is false. */
    public boolean getBoolean(String key, boolean defaultValue) {
        String v = getString(key, null);
        if (v == null) {
            return defaultValue;
        }
        v = v.trim();
        return v.equalsIgnoreCase("true") || v.equals("1")
                || v.equalsIgnoreCase("enabled") || v.equalsIgnoreCase("yes")
                || v.equalsIgnoreCase("on");
    }
}
