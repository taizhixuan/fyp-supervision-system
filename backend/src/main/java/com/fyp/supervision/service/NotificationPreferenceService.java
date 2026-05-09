package com.fyp.supervision.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.UserNotificationPreferences;
import com.fyp.supervision.notification.NotificationCategory;
import com.fyp.supervision.repository.UserNotificationPreferencesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final UserNotificationPreferencesRepository preferencesRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> loadPreferences(Long userId) {
        return preferencesRepository.findById(userId)
                .map(prefs -> {
                    if (prefs.getPreferencesJson() == null || prefs.getPreferencesJson().isBlank()) {
                        return defaultPreferences();
                    }
                    try {
                        return objectMapper.readValue(prefs.getPreferencesJson(),
                                new TypeReference<Map<String, Object>>() {});
                    } catch (Exception e) {
                        log.warn("Failed to parse preferences JSON for user {}, using defaults", userId);
                        return defaultPreferences();
                    }
                })
                .orElseGet(NotificationPreferenceService::defaultPreferences);
    }

    @Transactional
    public Map<String, Object> savePreferences(Long userId, Map<String, Object> prefs) throws Exception {
        String json = objectMapper.writeValueAsString(prefs);
        UserNotificationPreferences entity = preferencesRepository.findById(userId)
                .orElse(UserNotificationPreferences.builder().userId(userId).build());
        entity.setPreferencesJson(json);
        entity.setUpdatedAt(LocalDateTime.now());
        preferencesRepository.save(entity);
        return prefs;
    }

    public boolean shouldDeliverInApp(Long userId, NotificationCategory category) {
        Map<String, Object> prefs = loadPreferences(userId);
        if (!channelEnabled(prefs, "inApp", category)) {
            return false;
        }
        if (isInQuietHours(prefs)) {
            log.debug("In-app notification skipped: quiet hours for user {}", userId);
            return false;
        }
        return true;
    }

    public boolean shouldDeliverEmail(Long userId, NotificationCategory category) {
        Map<String, Object> prefs = loadPreferences(userId);
        if (!channelEnabled(prefs, "email", category)) {
            return false;
        }
        if (isInQuietHours(prefs)) {
            log.debug("Email skipped: quiet hours for user {}", userId);
            return false;
        }
        return true;
    }

    public boolean shouldDeliverPush(Long userId, NotificationCategory category) {
        Map<String, Object> prefs = loadPreferences(userId);
        if (!channelEnabled(prefs, "push", category)) {
            return false;
        }
        if (isInQuietHours(prefs)) {
            log.debug("Push skipped: quiet hours for user {}", userId);
            return false;
        }
        return true;
    }

    public NotificationCategory mapTypeToCategory(String type) {
        if (type == null) return NotificationCategory.SYSTEM_ANNOUNCEMENTS;
        String upper = type.toUpperCase();
        if (upper.startsWith("REQUEST")) return NotificationCategory.SUPERVISOR_MESSAGES;
        if (upper.startsWith("PROPOSAL")) return NotificationCategory.PROPOSAL_UPDATES;
        if (upper.startsWith("MEETING")) return NotificationCategory.MEETING_REMINDERS;
        if (upper.startsWith("DEADLINE")) return NotificationCategory.DEADLINE_REMINDERS;
        return NotificationCategory.SYSTEM_ANNOUNCEMENTS;
    }

    @SuppressWarnings("unchecked")
    private boolean channelEnabled(Map<String, Object> prefs, String channelKey, NotificationCategory category) {
        Object channel = prefs.get(channelKey);
        if (!(channel instanceof Map)) return true;
        Map<String, Object> channelMap = (Map<String, Object>) channel;
        if (Boolean.FALSE.equals(channelMap.get("enabled"))) return false;
        Object categoryValue = channelMap.get(category.prefKey());
        if (categoryValue == null) return true;
        return !Boolean.FALSE.equals(categoryValue);
    }

    @SuppressWarnings("unchecked")
    private boolean isInQuietHours(Map<String, Object> prefs) {
        Object quiet = prefs.get("quiet");
        if (!(quiet instanceof Map)) return false;
        Map<String, Object> quietMap = (Map<String, Object>) quiet;
        if (!Boolean.TRUE.equals(quietMap.get("enabled"))) return false;
        Object startObj = quietMap.get("startTime");
        Object endObj = quietMap.get("endTime");
        if (!(startObj instanceof String) || !(endObj instanceof String)) return false;
        try {
            LocalTime start = LocalTime.parse((String) startObj, DateTimeFormatter.ofPattern("HH:mm"));
            LocalTime end = LocalTime.parse((String) endObj, DateTimeFormatter.ofPattern("HH:mm"));
            LocalTime now = LocalTime.now();
            if (start.equals(end)) return false;
            if (start.isBefore(end)) {
                return !now.isBefore(start) && now.isBefore(end);
            }
            return !now.isBefore(start) || now.isBefore(end);
        } catch (Exception e) {
            return false;
        }
    }

    public static Map<String, Object> defaultPreferences() {
        Map<String, Object> prefs = new LinkedHashMap<>();
        prefs.put("email", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true));
        prefs.put("push", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true));
        prefs.put("inApp", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true));
        prefs.put("quiet", Map.of("enabled", false, "startTime", "22:00", "endTime", "08:00"));
        return prefs;
    }
}
