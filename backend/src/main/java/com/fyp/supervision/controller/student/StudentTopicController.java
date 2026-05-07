package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.SupervisorTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student/topics")
@RequiredArgsConstructor
public class StudentTopicController {
    private final SupervisorTopicService topicService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String researchArea,
            @RequestParam(required = false) String search) {
        List<Map<String, Object>> topics = topicService.listApprovedForStudents();
        if (researchArea != null && !researchArea.isBlank() && !"ALL".equalsIgnoreCase(researchArea)) {
            String wanted = researchArea.toLowerCase(Locale.ROOT);
            topics = topics.stream()
                    .filter(t -> t.get("researchArea") != null
                            && t.get("researchArea").toString().toLowerCase(Locale.ROOT).equals(wanted))
                    .collect(Collectors.toList());
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase(Locale.ROOT);
            topics = topics.stream()
                    .filter(t -> (t.get("title") != null && t.get("title").toString().toLowerCase(Locale.ROOT).contains(q))
                            || (t.get("description") != null && t.get("description").toString().toLowerCase(Locale.ROOT).contains(q))
                            || (t.get("supervisorName") != null && t.get("supervisorName").toString().toLowerCase(Locale.ROOT).contains(q)))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(Map.of("topics", topics, "total", topics.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        Map<String, Object> dto = topicService.getOne(id, null);
        // Students only see APPROVED topics.
        if (!"APPROVED".equals(dto.get("status"))) {
            return ResponseEntity.notFound().build();
        }
        dto.remove("feedback");
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long studentUserId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(topicService.confirm(studentUserId, id));
    }
}
