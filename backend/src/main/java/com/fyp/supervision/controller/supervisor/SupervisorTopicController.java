package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.service.SupervisorTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/topics")
@RequiredArgsConstructor
public class SupervisorTopicController {
    private final SupervisorTopicService topicService;

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> topics = topicService.listMine(userId);
        return ResponseEntity.ok(Map.of("topics", topics, "total", topics.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(topicService.getOne(id, userId));
    }

    @PostMapping
    public ResponseEntity<?> create(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(topicService.create(userId, data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(topicService.update(id, userId, data));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdraw(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(topicService.withdraw(id, userId));
    }
}
