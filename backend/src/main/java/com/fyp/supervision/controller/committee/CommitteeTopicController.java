package com.fyp.supervision.controller.committee;

import com.fyp.supervision.enums.TopicStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.service.SupervisorTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/topics")
@RequiredArgsConstructor
public class CommitteeTopicController {
    private final SupervisorTopicService topicService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "PENDING_REVIEW") String status) {
        TopicStatus s;
        try {
            s = TopicStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status");
        }
        List<Map<String, Object>> topics = topicService.listByStatus(s);
        return ResponseEntity.ok(Map.of("topics", topics, "total", topics.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return ResponseEntity.ok(topicService.getOne(id, null));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> review(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        String decision = data.get("decision") != null ? data.get("decision").toString() : null;
        String feedback = data.get("feedback") != null ? data.get("feedback").toString() : null;
        return ResponseEntity.ok(topicService.review(id, userId, decision, feedback));
    }
}
