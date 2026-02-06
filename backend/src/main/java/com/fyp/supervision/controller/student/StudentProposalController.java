package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.ProposalCheckResult;
import com.fyp.supervision.entity.ProposalVersion;
import com.fyp.supervision.repository.ProposalCheckResultRepository;
import com.fyp.supervision.service.AiServiceClient;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
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

    @GetMapping
    public ResponseEntity<?> getProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        try {
            return ResponseEntity.ok(studentService.getProposalDto(userId));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createProposal(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.createProposal(userId, data));
    }

    @PutMapping
    public ResponseEntity<?> updateProposal(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.updateProposal(userId, data));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.submitProposal(userId));
    }

    @GetMapping("/versions")
    public ResponseEntity<?> getVersions(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(Map.of("versions", studentService.getProposalVersionDtos(userId)));
    }

    @GetMapping("/feedback")
    public ResponseEntity<?> getFeedback(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(Map.of("feedback", studentService.getProposalFeedbackDtos(userId)));
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
                    ProposalCheckResult r = results.get(0);
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("analysisId", r.getCheckId().toString());
                    dto.put("proposalId", proposal.getProposalId().toString());
                    dto.put("overallScore", r.getOverallScore());
                    dto.put("sectionAnalysis", List.of());
                    dto.put("suggestions", List.of());
                    dto.put("strengths", studentService.parseJsonArray(r.getStrengths()));
                    dto.put("weaknesses", studentService.parseJsonArray(r.getWeaknesses()));
                    dto.put("analyzedAt", r.getCheckedAt() != null ? r.getCheckedAt().toString() : "");
                    return ResponseEntity.ok((Object) dto);
                })
                .orElse(ResponseEntity.ok(Map.of()));
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return studentService.getProposal(userId)
                .map(proposal -> {
                    List<ProposalVersion> versions = studentService.getProposal(userId)
                            .map(p -> p.getVersions())
                            .orElse(List.of());

                    // Send full proposal content (not just title) to the AI analyzer
                    String content = versions.stream()
                            .max(Comparator.comparing(ProposalVersion::getVersionNo))
                            .map(ProposalVersion::getContentText)
                            .orElse(proposal.getTitle());

                    // Prepend title if content doesn't already contain it
                    if (proposal.getTitle() != null && !content.contains(proposal.getTitle())) {
                        content = "Title: " + proposal.getTitle() + "\n\n" + content;
                    }

                    Map<String, Object> payload = new HashMap<>();
                    payload.put("proposalContent", content);
                    payload.put("sections", List.of("title", "problem_statement", "objectives", "methodology", "scope"));

                    Map<String, Object> result = aiServiceClient.analyzeProposal(payload);

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
                        // Log but don't fail
                    }

                    return ResponseEntity.ok((Object) result);
                })
                .orElse(ResponseEntity.ok(Map.of("error", "No proposal found. Create a proposal first.")));
    }

    private int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        try { return Integer.parseInt(value.toString()); } catch (NumberFormatException e) { return 0; }
    }

    private String toJsonString(Object value) {
        if (value == null) return "[]";
        try { return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(value); }
        catch (Exception e) { return "[]"; }
    }
}
