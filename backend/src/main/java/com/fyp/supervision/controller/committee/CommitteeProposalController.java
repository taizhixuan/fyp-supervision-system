package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.ProposalReview;
import com.fyp.supervision.entity.ProposalVersion;
import com.fyp.supervision.enums.ProposalStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProposalRepository;
import com.fyp.supervision.repository.ProposalReviewRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AuditService;
import com.fyp.supervision.service.CommitteeService;
import com.fyp.supervision.service.FileStorageService;
import com.fyp.supervision.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/proposals")
@RequiredArgsConstructor
public class CommitteeProposalController {
    private final ProposalRepository proposalRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;
    private final CommitteeService committeeService;
    private final AuditService auditService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<?> getProposals(@RequestParam(required = false) String status, Pageable pageable) {
        List<Map<String, Object>> proposals = committeeService.getProposalDtos(status, pageable);
        return ResponseEntity.ok(Map.of("proposals", proposals, "total", proposals.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProposal(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.getProposalDto(id));
    }

    /** Download a proposal's supporting attachment (latest version, or ?versionId=). */
    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long id,
            @RequestParam(value = "versionId", required = false) Long versionId) {
        ProposalVersion v = committeeService.resolveAttachmentVersion(id, versionId);
        Resource resource = fileStorageService.loadFile(v.getUploadFilePath());
        String fileName = v.getFileName() != null ? v.getFileName() : "attachment";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @PostMapping("/{id}/review")
    @Transactional
    public ResponseEntity<?> reviewProposal(@AuthenticationPrincipal UserDetails user,
                                            @PathVariable Long id,
                                            HttpServletRequest httpRequest,
                                            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Proposal proposal = proposalRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));

        // The committee is the SECOND reviewer. A proposal only reaches the committee
        // queue once the supervisor has approved it (status UNDER_REVIEW). Block any
        // attempt to review a proposal that the supervisor has not yet approved.
        if (proposal.getStatus() != ProposalStatus.UNDER_REVIEW) {
            throw new BadRequestException(
                    "This proposal is not awaiting committee review. The supervisor must approve it first.");
        }

        ProposalReview review = ProposalReview.builder()
                .proposal(proposal)
                .reviewer(userAccountRepository.findById(userId).orElseThrow())
                .reviewerRole("FYP_COMMITTEE")
                .decision((String) data.get("decision"))
                .remarks((String) data.get("feedback"))
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

        // Audit row tagged by decision so admins can filter "PROPOSAL_REVIEWED_APPROVED"
        // separately from REJECTED / REVISION_REQUIRED in the audit page.
        String studentLabel = proposal.getStudent() != null ? proposal.getStudent().getEmail() : ("proposal " + id);
        String safeDecision = decision == null ? "UNKNOWN" : decision;
        auditService.record(userAccountRepository.findById(userId).orElse(null),
                "PROPOSAL_REVIEWED_" + safeDecision, "PROPOSAL", String.valueOf(id),
                "student=" + studentLabel + " decision=" + safeDecision, httpRequest);

        return ResponseEntity.ok(Map.of("success", true));
    }
}
