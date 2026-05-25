package com.fyp.supervision.controller.student;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.ProposalCheckResult;
import com.fyp.supervision.entity.ProposalVersion;
import com.fyp.supervision.exception.AiServiceUnavailableException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProposalCheckResultRepository;
import com.fyp.supervision.service.AiServiceClient;
import com.fyp.supervision.service.ProposalDocumentService;
import com.fyp.supervision.service.StudentAccessService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/student/proposal")
@RequiredArgsConstructor
public class StudentProposalController {
    private final StudentService studentService;
    private final AiServiceClient aiServiceClient;
    private final ProposalCheckResultRepository checkResultRepository;
    private final ProposalDocumentService proposalDocumentService;
    private final StudentAccessService studentAccessService;

    @GetMapping
    public ResponseEntity<?> getProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        try {
            return ResponseEntity.ok(studentService.getProposalDto(userId));
        } catch (ResourceNotFoundException e) {
            // No proposal yet — frontend treats 404 as "render the empty workspace".
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createProposal(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        return ResponseEntity.ok(studentService.createProposal(userId, data));
    }

    @PutMapping
    public ResponseEntity<?> updateProposal(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        return ResponseEntity.ok(studentService.updateProposal(userId, data));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
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

                    // Build sectionAnalysis from the per-section scores the analyzer stored.
                    java.util.List<Map<String, Object>> sections = new java.util.ArrayList<>();
                    if (r.getFeasibilityScore() != null) sections.add(Map.of("section", "Feasibility", "score", r.getFeasibilityScore()));
                    if (r.getInnovationScore() != null)  sections.add(Map.of("section", "Innovation",  "score", r.getInnovationScore()));
                    if (r.getClarityScore() != null)     sections.add(Map.of("section", "Clarity",     "score", r.getClarityScore()));
                    if (r.getScopeScore() != null)       sections.add(Map.of("section", "Scope",       "score", r.getScopeScore()));
                    dto.put("sectionAnalysis", sections);

                    // suggested_improvements is stored as either a JSON array or newline-separated text.
                    java.util.List<String> suggestions = studentService.parseJsonArray(r.getSuggestedImprovements());
                    if (suggestions.isEmpty() && r.getSuggestedImprovements() != null && !r.getSuggestedImprovements().isBlank()) {
                        suggestions = java.util.Arrays.stream(r.getSuggestedImprovements().split("\\r?\\n"))
                                .map(String::trim).filter(s -> !s.isEmpty()).toList();
                    }
                    dto.put("suggestions", suggestions);

                    dto.put("strengths", studentService.parseJsonArray(r.getStrengths()));
                    dto.put("weaknesses", studentService.parseJsonArray(r.getWeaknesses()));
                    dto.put("analyzedAt", r.getCheckedAt() != null ? r.getCheckedAt().toString() : "");
                    return ResponseEntity.ok((Object) dto);
                })
                .orElse(ResponseEntity.ok(Map.of()));
    }

    /**
     * Render the canonical MMU FCI FYP Proposal Form .docx, populated with the
     * student's structured proposal data. Replaces the manual file upload as the
     * primary submission artifact.
     */
    @GetMapping("/export.docx")
    public ResponseEntity<?> exportDocx(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return studentService.getProposal(userId)
                .map(proposal -> {
                    try {
                        Map<String, Object> latestContent = studentService.getLatestProposalContent(proposal);
                        byte[] bytes = proposalDocumentService.renderProposalForm(proposal, latestContent);
                        String safeTitle = (proposal.getTitle() == null ? "FYP-Proposal" : proposal.getTitle())
                                .replaceAll("[^A-Za-z0-9._-]+", "_");
                        String filename = safeTitle + ".docx";
                        return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                                .contentType(MediaType.parseMediaType(
                                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                                .body((Object) bytes);
                    } catch (Exception e) {
                        return ResponseEntity.internalServerError()
                                .body((Object) Map.of("message", "Failed to generate document: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "No proposal found.")));
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeProposal(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return studentService.getProposal(userId)
                .map(proposal -> {
                    // Build a STABLE prose blob from the structured form fields. The
                    // analyzer's NLP scorer needs prose, not JSON.
                    String content = buildAnalyzerProse(proposal);
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("proposalContent", content);

                    Map<String, Object> result;
                    try {
                        result = aiServiceClient.analyzeProposal(payload);
                    } catch (AiServiceUnavailableException e) {
                        log.warn("Proposal analyzer unavailable for user {}: {}", userId, e.getMessage());
                        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body((Object) Map.of(
                                "message", "The proposal analysis service is temporarily unavailable. Please try again shortly.",
                                "error", "AI_SERVICE_UNAVAILABLE"
                        ));
                    }

                    try {
                        ProposalCheckResult checkResult = ProposalCheckResult.builder()
                                .proposal(proposal)
                                .checkedBy("AI_ANALYZER")
                                .overallScore(toInt(result.get("overallScore")))
                                .feasibilityScore(toInt(result.get("feasibilityScore")))
                                .innovationScore(toInt(result.get("innovationScore")))
                                .clarityScore(toInt(result.get("clarityScore")))
                                .scopeScore(toInt(result.get("scopeScore")))
                                .strengths(toJsonString(result.get("strengths")))
                                .weaknesses(toJsonString(result.get("weaknesses")))
                                .remarks(result.get("summary") != null ? result.get("summary").toString() : "")
                                .build();
                        checkResultRepository.save(checkResult);
                    } catch (Exception e) {
                        log.warn("Failed to persist proposal analysis for user {}: {}", userId, e.getMessage());
                    }

                    return ResponseEntity.ok((Object) result);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of("message", "No proposal found. Create a proposal first.")));
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

    /**
     * Compose the prose blob the analyzer scores. Stable section order so successive
     * runs are comparable, and we hide the structured fields (Status / Type /
     * Specialisation / etc.) the analyzer can't usefully reason about.
     */
    private String buildAnalyzerProse(Proposal proposal) {
        ProposalVersion latest = proposal.getVersions().stream()
                .max(Comparator.comparing(ProposalVersion::getVersionNo))
                .orElse(null);
        Map<String, Object> content = Map.of();
        if (latest != null && latest.getContentText() != null) {
            try {
                content = new ObjectMapper().readValue(latest.getContentText(), Map.class);
            } catch (Exception ignored) {
                // fall through with empty content
            }
        }

        StringBuilder sb = new StringBuilder();
        appendBlock(sb, "Title", proposal.getTitle());
        appendBlock(sb, "Problem Statement", str(content.get("problemStatement")));
        appendList(sb, "Objectives", content.get("objectives"));
        appendBlock(sb, "Methodology", str(content.get("methodology")));
        appendBlock(sb, "Scope", str(content.get("scope")));
        appendList(sb, "Expected Outcomes", content.get("expectedOutcomes"));
        appendBlock(sb, "Timeline", str(content.get("timeline")));
        return sb.toString().trim();
    }

    private void appendBlock(StringBuilder sb, String label, String value) {
        if (value == null || value.isBlank()) return;
        sb.append(label).append(":\n").append(value.trim()).append("\n\n");
    }

    @SuppressWarnings("unchecked")
    private void appendList(StringBuilder sb, String label, Object value) {
        if (!(value instanceof List<?> list) || list.isEmpty()) return;
        sb.append(label).append(":\n");
        int i = 1;
        for (Object item : (List<Object>) list) {
            String s = str(item);
            if (s == null || s.isBlank()) continue;
            sb.append(i++).append(". ").append(s.trim()).append('\n');
        }
        sb.append('\n');
    }

    private String str(Object value) {
        return value == null ? null : value.toString();
    }
}
