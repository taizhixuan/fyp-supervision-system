package com.fyp.supervision.controller.student;

import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.service.ActionItemService;
import com.fyp.supervision.service.StudentAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/action-items")
@RequiredArgsConstructor
public class StudentActionItemController {

    private final ActionItemService actionItemService;
    private final ProjectRepository projectRepository;
    private final StudentAccessService studentAccessService;

    /** Open items (oldest first) and recently completed ones for the student's project. */
    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> body = projectRepository.findByStudent_UserId(userId)
                .map(p -> actionItemService.forProject(p.getProjectId()))
                .orElseGet(() -> Map.of("open", List.of(), "done", List.of(), "openCount", 0));
        return ResponseEntity.ok(body);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal UserDetails user, @PathVariable Long id,
                                    @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        return ResponseEntity.ok(actionItemService.toDto(actionItemService.setStatus(id, userId, data.get("status"))));
    }
}
