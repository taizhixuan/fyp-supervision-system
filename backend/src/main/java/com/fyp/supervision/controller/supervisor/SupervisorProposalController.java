package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.service.SupervisorAccessService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/proposals")
@RequiredArgsConstructor
public class SupervisorProposalController {
    private final SupervisorService supervisorService;
    private final SupervisorAccessService access;

    @GetMapping
    public ResponseEntity<?> getProposals(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> proposals = supervisorService.getProposalDtos(userId);
        return ResponseEntity.ok(Map.of("proposals", proposals, "total", proposals.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProposal(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        access.requireOwnProposal(userId, id);
        return ResponseEntity.ok(supervisorService.getProposalForReviewDto(id));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> provideFeedback(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        access.requireOwnProposal(userId, id);
        return ResponseEntity.ok(supervisorService.provideFeedback(id, userId, data));
    }
}
