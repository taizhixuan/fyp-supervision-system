package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

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
        return ResponseEntity.ok(fetchRecommendations(Long.parseLong(user.getUsername())));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshRecommendations(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(fetchRecommendations(Long.parseLong(user.getUsername())));
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

        // Build supervisor profiles payload
        List<SupervisorProfile> supervisors = supervisorProfileRepository.findAll();
        List<Map<String, Object>> supervisorPayloads = new ArrayList<>();
        for (SupervisorProfile sp : supervisors) {
            UserAccount supAccount = sp.getUser();
            if (supAccount == null) continue;

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

        return aiServiceClient.getRecommendations(payload);
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
