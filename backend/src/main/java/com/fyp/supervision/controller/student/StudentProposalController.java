package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.ProposalCheckResult;
import com.fyp.supervision.entity.ProposalVersion;
import com.fyp.supervision.repository.ProposalCheckResultRepository;
import com.fyp.supervision.repository.ProposalReviewRepository;
import com.fyp.supervision.service.AiServiceClient;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/proposal")
@RequiredArgsConstructor
public class StudentProposalController {
    private final StudentService studentService;
    private final AiServiceClient aiServiceClient;
    private final ProposalCheckResultRepository checkResultRepository;
    private final ProposalReviewRepository reviewRepository;

    @GetMapping
    public ResponseEntity<?> getProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return studentService.getProposal(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createProposal(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Proposal proposal = studentService.createProposal(userId, data);
        return ResponseEntity.ok(proposal);
    }

    @PutMapping
    public ResponseEntity<?> updateProposal(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Proposal proposal = studentService.updateProposal(userId, data);
        return ResponseEntity.ok(proposal);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Proposal proposal = studentService.submitProposal(userId);
        return ResponseEntity.ok(proposal);
    }

    @GetMapping("/versions")
    public ResponseEntity<?> getVersions(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        List<ProposalVersion> versions = studentService.getProposalVersions(userId);
        return ResponseEntity.ok(Map.of("versions", versions));
    }

    @GetMapping("/feedback")
    public ResponseEntity<?> getFeedback(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return studentService.getProposal(userId)
                .map(proposal -> {
                    var reviews = reviewRepository.findByProposal_ProposalIdOrderByReviewedAtDesc(proposal.getProposalId());
                    return ResponseEntity.ok(Map.of("feedback", reviews));
                })
                .orElse(ResponseEntity.ok(Map.of("feedback", List.of())));
    }

    @GetMapping("/analysis")
    public ResponseEntity<?> getAnalysis(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return studentService.getProposal(userId)
                .map(proposal -> {
                    var results = checkResultRepository.findByProposal_ProposalIdOrderByCheckedAtDesc(proposal.getProposalId());
                    if (results.isEmpty()) {
                        return ResponseEntity.ok(Map.of());
                    }
                    return ResponseEntity.ok((Object) results.get(0));
                })
                .orElse(ResponseEntity.ok(Map.of()));
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return studentService.getProposal(userId)
                .map(proposal -> {
                    // Get latest version content
                    List<ProposalVersion> versions = studentService.getProposalVersions(userId);
                    String content = proposal.getTitle();
                    if (!versions.isEmpty()) {
                        ProposalVersion latest = versions.get(0);
                        content = proposal.getTitle() + "\n\n" + (latest.getContentText() != null ? latest.getContentText() : "");
                    }

                    // Call AI service
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("proposalContent", content);
                    payload.put("sections", List.of("title", "problem_statement", "objectives", "methodology", "scope"));

                    Map<String, Object> result = aiServiceClient.analyzeProposal(payload);

                    // Store result
                    try {
                        ProposalCheckResult checkResult = ProposalCheckResult.builder()
                                .proposal(proposal)
                                .checkedBy("AI_ANALYZER")
                                .overallScore(toInt(result.get("overallScore")))
                                .feasibilityScore(toInt(result.get("feasibilityScore")))
                                .innovationScore(toInt(result.get("innovationScore")))
                                .clarityScore(toInt(result.get("clarityScore")))
                                .scopeScore(toInt(result.get("scopeScore")))
                                .plagiarismScore(toInt(result.get("plagiarismScore")))
                                .strengths(toJsonString(result.get("strengths")))
                                .weaknesses(toJsonString(result.get("weaknesses")))
                                .remarks(result.get("summary") != null ? result.get("summary").toString() : "")
                                .build();
                        checkResultRepository.save(checkResult);
                    } catch (Exception e) {
                        // Log but don't fail — return the AI result even if storage fails
                    }

                    return ResponseEntity.ok((Object) result);
                })
                .orElse(ResponseEntity.ok(Map.of("error", "No proposal found. Create a proposal first.")));
    }

    private int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String toJsonString(Object value) {
        if (value == null) return "[]";
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(value);
        } catch (Exception e) {
            return "[]";
        }
    }
}
