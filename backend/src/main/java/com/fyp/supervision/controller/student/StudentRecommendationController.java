package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.AiServiceUnavailableException;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/student/recommendations")
@RequiredArgsConstructor
public class StudentRecommendationController {

    private final AiServiceClient aiServiceClient;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<?> getRecommendations(@AuthenticationPrincipal UserDetails user) {
        return runAndWrap(Long.parseLong(user.getUsername()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshRecommendations(@AuthenticationPrincipal UserDetails user) {
        return runAndWrap(Long.parseLong(user.getUsername()));
    }

    private ResponseEntity<?> runAndWrap(Long userId) {
        try {
            return ResponseEntity.ok(fetchRecommendations(userId));
        } catch (AiServiceUnavailableException e) {
            log.warn("Recommendation service unavailable for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "The recommendation service is temporarily unavailable. Please try again shortly.",
                    "error", "AI_SERVICE_UNAVAILABLE"
            ));
        }
    }

    private Map<String, Object> fetchRecommendations(Long userId) {
        // Build student profile payload
        StudentProfile studentProfile = studentProfileRepository.findById(userId).orElse(null);
        UserAccount studentAccount = userAccountRepository.findById(userId).orElse(null);

        Map<String, Object> studentPayload = new HashMap<>();
        if (studentProfile != null) {
            studentPayload.put("userId", userId);
            studentPayload.put("programme", studentProfile.getProgramme());
            studentPayload.put("specialisation", studentProfile.getSpecialisation());
            studentPayload.put("interests", parseJsonArray(studentProfile.getInterests()));
            studentPayload.put("skills", parseJsonArray(studentProfile.getSkills()));
            studentPayload.put("bio", studentProfile.getBio());
        }
        if (studentAccount != null) {
            studentPayload.put("fullName", studentAccount.getFullName());
        }

        // Build supervisor profiles payload + index for post-processing
        List<SupervisorProfile> supervisors = supervisorProfileRepository.findAll();
        List<Map<String, Object>> supervisorPayloads = new ArrayList<>();
        Map<Long, SupervisorProfile> supervisorById = new HashMap<>();
        for (SupervisorProfile sp : supervisors) {
            UserAccount supAccount = sp.getUser();
            if (supAccount == null) continue;
            supervisorById.put(supAccount.getUserId(), sp);

            Map<String, Object> supPayload = new HashMap<>();
            supPayload.put("userId", supAccount.getUserId());
            supPayload.put("fullName", supAccount.getFullName());
            supPayload.put("department", sp.getDepartment());
            supPayload.put("faculty", sp.getFaculty());
            supPayload.put("researchAreas", parseJsonArray(sp.getResearchAreas()));
            supPayload.put("expertise", parseJsonArray(sp.getExpertise()));
            supPayload.put("preferredProjectTypes", parseJsonArray(sp.getPreferredProjectTypes()));
            supPayload.put("bio", sp.getBio());
            supPayload.put("availabilityStatus", sp.getAvailabilityStatus());
            supPayload.put("currentLoad", sp.getCurrentLoad());
            supPayload.put("supervisionQuota", sp.getSupervisionQuota());
            supervisorPayloads.add(supPayload);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("studentProfile", studentPayload);
        payload.put("supervisorProfiles", supervisorPayloads);

        Map<String, Object> aiResponse = aiServiceClient.getRecommendations(payload);
        return transformResponse(aiResponse, supervisorById);
    }

    /**
     * AI service returns a flat list. Frontend expects a nested {supervisor, rank,
     * matchScore, matchReasons} shape. Enrich each entry with profile fields the AI
     * doesn't echo (title, faculty, maxCapacity, isAcceptingStudents).
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> transformResponse(Map<String, Object> aiResponse,
                                                  Map<Long, SupervisorProfile> supervisorById) {
        if (aiResponse == null) {
            return Map.of("recommendations", List.of(), "generatedAt", null);
        }
        Object rawList = aiResponse.get("recommendations");
        if (!(rawList instanceof List<?> list)) {
            return Map.of("recommendations", List.of(),
                    "generatedAt", aiResponse.get("generatedAt"));
        }

        List<Map<String, Object>> out = new ArrayList<>();
        int rank = 1;
        for (Object raw : list) {
            if (!(raw instanceof Map<?, ?> rec)) continue;
            Map<String, Object> recMap = (Map<String, Object>) rec;
            Long supervisorId = toLong(recMap.get("supervisorId"));
            SupervisorProfile sp = supervisorId != null ? supervisorById.get(supervisorId) : null;
            UserAccount supAccount = sp != null ? sp.getUser() : null;

            Map<String, Object> supervisorDto = new LinkedHashMap<>();
            supervisorDto.put("supervisorId", supervisorId != null ? supervisorId.toString() : null);
            supervisorDto.put("userId", supervisorId != null ? supervisorId.toString() : null);
            supervisorDto.put("fullName", supAccount != null
                    ? supAccount.getFullName()
                    : recMap.getOrDefault("supervisorName", "Unknown"));
            supervisorDto.put("email", supAccount != null ? supAccount.getEmail() : null);
            supervisorDto.put("title", sp != null ? sp.getPosition() : null);
            supervisorDto.put("department", sp != null ? sp.getDepartment() : recMap.get("department"));
            supervisorDto.put("faculty", sp != null ? sp.getFaculty() : null);
            supervisorDto.put("researchAreas", recMap.getOrDefault("researchAreas", List.of()));
            int currentLoad = sp != null && sp.getCurrentLoad() != null ? sp.getCurrentLoad() : 0;
            int quota = sp != null && sp.getSupervisionQuota() != null ? sp.getSupervisionQuota() : 8;
            String availability = sp != null ? sp.getAvailabilityStatus() : null;
            supervisorDto.put("currentLoad", currentLoad);
            supervisorDto.put("maxCapacity", quota);
            supervisorDto.put("isAcceptingStudents",
                    currentLoad < quota && !"UNAVAILABLE".equalsIgnoreCase(availability));

            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("supervisor", supervisorDto);
            dto.put("rank", rank++);
            Number score = (Number) recMap.getOrDefault("matchScore", 0);
            int scoreInt = (int) Math.round(score.doubleValue());
            dto.put("matchScore", scoreInt);
            dto.put("matchReasons", buildMatchReasons(recMap, scoreInt));
            // Pass through the four scoring components from the recommender so
            // the UI can render a real breakdown (semantic / keyword / programme
            // / availability) rather than just the rolled-up score.
            Object components = recMap.get("components");
            if (components instanceof Map<?, ?>) {
                dto.put("components", components);
            }
            Object explanation = recMap.get("explanation");
            if (explanation instanceof String s && !s.isBlank()) {
                dto.put("explanation", s);
            }
            out.add(dto);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("recommendations", out);
        result.put("generatedAt", aiResponse.get("generatedAt"));
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buildMatchReasons(Map<String, Object> rec, int matchScore) {
        List<Map<String, Object>> reasons = new ArrayList<>();
        Object areas = rec.get("matchAreas");
        if (areas instanceof List<?> areaList && !areaList.isEmpty()) {
            reasons.add(Map.of(
                    "category", "research_area",
                    "description", "Overlapping interests: " + String.join(", ", (List<String>) areaList),
                    "score", matchScore
            ));
        }
        Number load = (Number) rec.getOrDefault("currentLoad", 0);
        Number quota = (Number) rec.getOrDefault("supervisionQuota", 8);
        int slots = Math.max(0, quota.intValue() - load.intValue());
        reasons.add(Map.of(
                "category", "availability",
                "description", slots > 0 ? slots + " open slot" + (slots == 1 ? "" : "s") : "Currently full",
                "score", slots > 0 ? Math.min(100, slots * 25) : 0
        ));
        return reasons;
    }

    private Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(v.toString());
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(json, List.class);
        } catch (Exception e) {
            return List.of(json);
        }
    }
}
