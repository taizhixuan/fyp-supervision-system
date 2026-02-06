package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.Proposal;
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

    @GetMapping
    public ResponseEntity<?> getProposals(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        List<Proposal> proposals = supervisorService.getProposals(userId);
        return ResponseEntity.ok(Map.of("proposals", proposals));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProposal(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("proposalId", id));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> provideFeedback(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(supervisorService.provideFeedback(id, userId, data));
    }
}
