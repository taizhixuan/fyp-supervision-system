package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.MeetingLogComplianceService;
import com.fyp.supervision.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/projects")
@RequiredArgsConstructor
public class AdminProjectController {
    private final ProjectRepository projectRepository;
    private final UserAccountRepository userRepository;
    private final NotificationService notificationService;
    private final MeetingLogComplianceService meetingLogComplianceService;

    @GetMapping("/fyp1-pass")
    public ResponseEntity<?> getFyp1Projects() {
        List<Project> projects = projectRepository.findFyp1Projects();
        List<Map<String, Object>> dtos = new ArrayList<>();
        long passed = 0, failed = 0, pending = 0;
        for (Project p : projects) {
            UserAccount student = p.getStudent();
            UserAccount supervisor = p.getSupervisor();
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("projectId", p.getProjectId());
            dto.put("projectTitle", p.getProjectTitle());
            dto.put("studentId", student != null ? student.getMmuId() : null);
            dto.put("studentUserId", student != null ? student.getUserId() : null);
            dto.put("studentName", student != null ? student.getFullName() : null);
            dto.put("studentEmail", student != null ? student.getEmail() : null);
            dto.put("supervisorName", supervisor != null ? supervisor.getFullName() : null);
            dto.put("stage", p.getStage() != null ? p.getStage() : "FYP1");
            dto.put("fyp1Passed", p.getFyp1Passed());
            // Compliance signal — soft warning, not enforced server-side. Surfaces "X/6
            // logs" badge on the admin pass-tracking page so reviewers see at a glance
            // whether a student met the FYP1 supervision-log minimum.
            int completed = student != null
                    ? meetingLogComplianceService.completedLogCount(student.getUserId(), "FYP1") : 0;
            int required = meetingLogComplianceService.requiredLogCount("FYP1");
            dto.put("meetingLogsCompleted", completed);
            dto.put("meetingLogsRequired", required);
            dto.put("meetsMeetingLogMinimum", completed >= required);
            dtos.add(dto);
            if (Boolean.TRUE.equals(p.getFyp1Passed())) passed++;
            else if (Boolean.FALSE.equals(p.getFyp1Passed())) failed++;
            else pending++;
        }
        return ResponseEntity.ok(Map.of(
                "projects", dtos,
                "total", dtos.size(),
                "passedCount", passed,
                "failedCount", failed,
                "pendingCount", pending
        ));
    }

    @PostMapping("/{id}/fyp1-passed")
    public ResponseEntity<?> setFyp1Passed(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        Object passedRaw = data.get("passed");
        Boolean passed = passedRaw == null ? null : (Boolean) passedRaw;
        project.setFyp1Passed(passed);
        projectRepository.save(project);
        if (passed != null && project.getStudent() != null) {
            String msg = passed
                    ? "You passed FYP1. You can proceed to FYP2 on your next login."
                    : "Your FYP1 result is failed. Please contact the FYP committee.";
            notificationService.createNotification(
                    project.getStudent().getUserId(),
                    "FYP1_RESULT",
                    "FYP1 result released",
                    msg,
                    "/student"
            );
        }
        return ResponseEntity.ok(Map.of("projectId", id, "fyp1Passed", passed));
    }

    @PostMapping("/fyp1-passed/import")
    public ResponseEntity<?> importFyp1Passed(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("CSV file is empty");
        }
        int updated = 0;
        List<String> notFound = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                if (firstLine && line.toLowerCase().contains("studentid")) {
                    firstLine = false;
                    continue;
                }
                firstLine = false;
                String[] parts = line.split(",");
                if (parts.length < 2) continue;
                String mmuId = parts[0].trim();
                String passedStr = parts[1].trim().toLowerCase();
                Boolean passed;
                if (passedStr.equals("true") || passedStr.equals("1") || passedStr.equals("pass") || passedStr.equals("passed")) {
                    passed = Boolean.TRUE;
                } else if (passedStr.equals("false") || passedStr.equals("0") || passedStr.equals("fail") || passedStr.equals("failed")) {
                    passed = Boolean.FALSE;
                } else {
                    continue;
                }
                UserAccount student = userRepository.findByMmuId(mmuId).orElse(null);
                if (student == null) {
                    notFound.add(mmuId);
                    continue;
                }
                Project project = projectRepository.findByStudent_UserId(student.getUserId()).orElse(null);
                if (project == null) {
                    notFound.add(mmuId);
                    continue;
                }
                project.setFyp1Passed(passed);
                projectRepository.save(project);
                updated++;
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to read CSV: " + e.getMessage());
        }
        return ResponseEntity.ok(Map.of(
                "updated", updated,
                "notFound", notFound,
                "notFoundCount", notFound.size()
        ));
    }
}
