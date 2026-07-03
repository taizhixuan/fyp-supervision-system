package com.fyp.supervision.service;

import com.fyp.supervision.entity.IntegrationSetting;
import com.fyp.supervision.repository.IntegrationSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Lets the admin Integration Settings screen actually gate runtime behaviour.
 * A row whose status is ACTIVE means the integration is on; any other status
 * means off. Every lookup is fail-open: if the row is missing or the query
 * fails, the integration is treated as enabled, so an empty or broken table can
 * never take a working feature offline. Environment configuration remains the
 * base source of truth; this layer only lets an admin turn a configured
 * integration OFF from the UI.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntegrationConfigService {

    private static final String ACTIVE = "ACTIVE";
    private final IntegrationSettingRepository repository;

    /** Enabled unless rows of this type exist and none of them is ACTIVE. */
    public boolean isTypeEnabled(String type) {
        try {
            List<IntegrationSetting> rows = repository.findByIntegrationType(type);
            if (rows == null || rows.isEmpty()) {
                return true;
            }
            return rows.stream().anyMatch(r -> ACTIVE.equalsIgnoreCase(r.getStatus()));
        } catch (Exception e) {
            log.debug("Integration type check failed for {}, defaulting to enabled: {}", type, e.getMessage());
            return true;
        }
    }

    /** Enabled unless a row with this exact name exists and is not ACTIVE. */
    public boolean isEnabledByName(String name) {
        try {
            return repository.findFirstByNameIgnoreCase(name)
                    .map(r -> ACTIVE.equalsIgnoreCase(r.getStatus()))
                    .orElse(true);
        } catch (Exception e) {
            log.debug("Integration name check failed for {}, defaulting to enabled: {}", name, e.getMessage());
            return true;
        }
    }
}
