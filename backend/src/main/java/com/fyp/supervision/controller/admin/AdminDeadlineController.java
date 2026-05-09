package com.fyp.supervision.controller.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/deadlines")
@RequiredArgsConstructor
public class AdminDeadlineController {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final DeadlineRepository deadlineRepository;
    private final FypCycleRepository cycleRepository;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<?> getDeadlines(@RequestParam(required = false) Long cycleId) {
        return ResponseEntity.ok(adminService.getDeadlines(cycleId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDeadline(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getDeadlineDetail(id));
    }

    @PostMapping
    public ResponseEntity<?> createDeadline(@RequestBody Map<String, Object> data) {
        String title = string(data, "title", "name");
        if (title == null || title.isBlank()) {
            throw new BadRequestException("Deadline title is required.");
        }
        Long cycleId = longField(data, "cycleId");
        if (cycleId == null) {
            throw new BadRequestException("cycleId is required.");
        }
        LocalDate dueDate = parseDate(data.get("dueDate"));
        if (dueDate == null) {
            throw new BadRequestException("dueDate is required.");
        }

        Deadline deadline = Deadline.builder()
                .title(title)
                .description(string(data, "description"))
                .dueDate(dueDate)
                .deadlineType(string(data, "deadlineType", "type"))
                .audience(audience(data))
                .isExtendable(boolField(data, "isExtendable"))
                .reminderDays(serializeReminderDays(data.get("reminderDays")))
                .build();

        cycleRepository.findById(cycleId).ifPresentOrElse(
                deadline::setCycle,
                () -> { throw new BadRequestException("Cycle not found: " + cycleId); }
        );

        Deadline saved = deadlineRepository.save(deadline);
        return ResponseEntity.ok(adminService.buildDeadlineDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDeadline(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Deadline d = deadlineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deadline not found"));

        if (data.containsKey("title") || data.containsKey("name")) {
            String t = string(data, "title", "name");
            if (t != null && !t.isBlank()) d.setTitle(t);
        }
        if (data.containsKey("description")) d.setDescription(string(data, "description"));
        if (data.containsKey("deadlineType") || data.containsKey("type")) {
            d.setDeadlineType(string(data, "deadlineType", "type"));
        }
        if (data.containsKey("audience") || data.containsKey("targetRoles")) {
            d.setAudience(audience(data));
        }
        if (data.containsKey("dueDate")) {
            LocalDate dd = parseDate(data.get("dueDate"));
            if (dd != null) d.setDueDate(dd);
        }
        if (data.containsKey("extendedDate")) {
            LocalDate ed = parseDate(data.get("extendedDate"));
            d.setExtendedDate(ed);
        }
        if (data.containsKey("isExtendable")) d.setIsExtendable(boolField(data, "isExtendable"));
        if (data.containsKey("reminderDays")) {
            String json = serializeReminderDays(data.get("reminderDays"));
            if (json != null) d.setReminderDays(json);
        }

        Deadline saved = deadlineRepository.save(d);
        return ResponseEntity.ok(adminService.buildDeadlineDto(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeadline(@PathVariable Long id) {
        deadlineRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static String string(Map<String, Object> data, String... keys) {
        for (String key : keys) {
            Object v = data.get(key);
            if (v != null) return v.toString();
        }
        return null;
    }

    private static Long longField(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Boolean boolField(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(v.toString());
    }

    /** Accepts either a single audience string ("STUDENT") or a targetRoles list (["STUDENT","SUPERVISOR"]). */
    @SuppressWarnings("unchecked")
    private static String audience(Map<String, Object> data) {
        Object aud = data.get("audience");
        if (aud instanceof String s && !s.isBlank()) return s;
        Object roles = data.get("targetRoles");
        if (roles instanceof List<?> list && !list.isEmpty()) {
            return list.stream().map(Object::toString).reduce((a, b) -> a + "," + b).orElse(null);
        }
        return null;
    }

    private static LocalDate parseDate(Object value) {
        if (value == null) return null;
        String s = value.toString();
        if (s.isBlank()) return null;
        try {
            int t = s.indexOf('T');
            return LocalDate.parse(t < 0 ? s : s.substring(0, t));
        } catch (DateTimeParseException e) {
            throw new BadRequestException("dueDate must be a valid ISO date (YYYY-MM-DD).");
        }
    }

    /** Always store reminderDays as a JSON array string so {@code AdminService.buildDeadlineDto} can round-trip it. */
    private static String serializeReminderDays(Object value) {
        if (value == null) return null;
        try {
            List<Integer> normalised = new ArrayList<>();
            if (value instanceof List<?> list) {
                for (Object item : list) {
                    if (item instanceof Number n) normalised.add(n.intValue());
                    else normalised.add(Integer.parseInt(item.toString()));
                }
            } else if (value instanceof Number n) {
                normalised.add(n.intValue());
            } else {
                String s = value.toString().trim();
                if (s.isEmpty()) return null;
                if (s.startsWith("[")) {
                    return s; // already JSON
                }
                normalised.add(Integer.parseInt(s));
            }
            return OBJECT_MAPPER.writeValueAsString(normalised);
        } catch (Exception e) {
            throw new BadRequestException("reminderDays must be an integer or array of integers.");
        }
    }
}
