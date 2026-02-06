package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.ProposalReview;
import com.fyp.supervision.enums.ProposalStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProposalRepository;
import com.fyp.supervision.repository.ProposalReviewRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/committee/proposals")
@RequiredArgsConstructor
public class CommitteeProposalController {
    private final ProposalRepository proposalRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<Proposal>> getProposals(@RequestParam(required = false) String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(proposalRepository.findByStatus(ProposalStatus.valueOf(status), pageable));
        }
        return ResponseEntity.ok(proposalRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proposal> getProposal(@PathVariable Long id) {
        return ResponseEntity.ok(proposalRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found")));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> reviewProposal(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Proposal proposal = proposalRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));

        ProposalReview review = ProposalReview.builder()
                .proposal(proposal)
                .reviewer(userAccountRepository.findById(userId).orElseThrow())
                .reviewerRole("FYP_COMMITTEE")
                .decision((String) data.get("decision"))
                .remarks((String) data.get("remarks"))
                .internalNotes((String) data.get("internalNotes"))
                .build();
        proposalReviewRepository.save(review);

        String decision = (String) data.get("decision");
        if ("APPROVED".equals(decision)) {
            proposal.setStatus(ProposalStatus.APPROVED);
        } else if ("REJECTED".equals(decision)) {
            proposal.setStatus(ProposalStatus.REJECTED);
        } else {
            proposal.setStatus(ProposalStatus.REVISION_REQUIRED);
        }
        proposalRepository.save(proposal);

        notificationService.createNotification(
                proposal.getStudent().getUserId(), "PROPOSAL",
                "Proposal Review Decision",
                "Your proposal has been reviewed by the FYP committee.",
                "/student/proposal"
        );

        return ResponseEntity.ok(Map.of("success", true));
    }
}
