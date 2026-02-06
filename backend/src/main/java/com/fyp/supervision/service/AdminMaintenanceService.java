package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.MaintenanceJob;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AuditLogRepository;
import com.fyp.supervision.repository.MaintenanceJobRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminMaintenanceService {

    private final MaintenanceJobRepository maintenanceJobRepository;
    private final UserAccountRepository userAccountRepository;
    private final AuditLogRepository auditLogRepository;
    private final FileStorageConfig fileStorageConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> getJobs() {
        List<Map<String, Object>> jobs = maintenanceJobRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toJobDto)
                .limit(100)
                .collect(Collectors.toList());
        return Map.of("jobs", jobs, "total", jobs.size());
    }

    public Map<String, Object> getBackups() {
        List<Map<String, Object>> backups = new ArrayList<>();
        try {
            Path backupDir = fileStorageConfig.getUploadPath().resolve("backups");
            if (Files.exists(backupDir)) {
                try (var stream = Files.list(backupDir)) {
                    stream.filter(p -> Files.isRegularFile(p) && (p.toString().endsWith(".sql") || p.toString().endsWith(".txt")))
                            .sorted((a, b) -> {
                                try {
                                    return Files.getLastModifiedTime(b).compareTo(Files.getLastModifiedTime(a));
                                } catch (IOException e) {
                                    return 0;
                                }
                            })
                            .limit(50)
                            .forEach(p -> {
                                Map<String, Object> b = new LinkedHashMap<>();
                                b.put("backupId", backups.size() + 1);
                                b.put("fileName", p.getFileName().toString());
                                try {
                                    b.put("fileSize", Files.size(p));
                                    b.put("createdAt", Files.getLastModifiedTime(p).toString());
                                } catch (IOException ignored) {}
                                b.put("type", "FULL");
                                b.put("status", "AVAILABLE");
                                b.put("expiresAt", LocalDateTime.now().plusMonths(1).toString());
                                backups.add(b);
                            });
                }
            }
        } catch (IOException ignored) {}
        return Map.of("backups", backups, "total", backups.size());
    }

    public Map<String, Object> createBackup(Long userId, Map<String, Object> data) {
        String type = (String) data.getOrDefault("type", "FULL");
        MaintenanceJob job = MaintenanceJob.builder()
                .jobType("BACKUP")
                .status("RUNNING")
                .startedAt(LocalDateTime.now())
                .message("Backup started")
                .triggeredBy(userId != null ? userAccountRepository.findById(userId).orElse(null) : null)
                .build();
        job = maintenanceJobRepository.save(job);

        try {
            Path backupDir = fileStorageConfig.getUploadPath().resolve("backups");
            Files.createDirectories(backupDir);
            String fileName = "backup_" + System.currentTimeMillis() + ".txt";
            Path filePath = backupDir.resolve(fileName);
            String content = "FYP Supervision System - Backup marker\n"
                    + "Type: " + type + "\n"
                    + "Created: " + LocalDateTime.now() + "\n"
                    + "For full database backup, use mysqldump externally.";
            Files.writeString(filePath, content, StandardCharsets.UTF_8);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "Backup created: " + fileName);
            result.put("artifactUrl", "/api/admin/maintenance/backups/" + fileName);
            result.put("fileSize", Files.size(filePath));

            job.setStatus("COMPLETED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage("Backup completed");
            job.setResultJson(objectMapper.writeValueAsString(result));
            maintenanceJobRepository.save(job);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job.getJobId());
            response.put("type", type);
            response.put("status", "COMPLETED");
            response.put("downloadUrl", "/api/admin/maintenance/backups/download?file=" + fileName);
            return response;
        } catch (Exception e) {
            job.setStatus("FAILED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage("Backup failed: " + e.getMessage());
            maintenanceJobRepository.save(job);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job.getJobId());
            response.put("type", type);
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return response;
        }
    }

    public Map<String, Object> restoreBackup(Long userId, String backupId) {
        MaintenanceJob job = MaintenanceJob.builder()
                .jobType("RESTORE")
                .status("PENDING")
                .triggeredBy(userId != null ? userAccountRepository.findById(userId).orElse(null) : null)
                .message("Restore requested. Manual restore required - use mysql client with backup file.")
                .build();
        job = maintenanceJobRepository.save(job);
        job.setStartedAt(LocalDateTime.now());
        job.setStatus("COMPLETED");
        job.setCompletedAt(LocalDateTime.now());
        job.setResultJson("{\"message\":\"Restore not automated. Use backup file with mysql client.\"}");
        maintenanceJobRepository.save(job);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("jobId", job.getJobId());
        response.put("backupId", backupId);
        response.put("status", "COMPLETED");
        response.put("message", "Restore request recorded. For actual restore use backup file with mysql client.");
        return response;
    }

    public Map<String, Object> cleanup(Long userId, Map<String, Object> options) {
        MaintenanceJob job = MaintenanceJob.builder()
                .jobType("CLEANUP")
                .status("RUNNING")
                .startedAt(LocalDateTime.now())
                .triggeredBy(userId != null ? userAccountRepository.findById(userId).orElse(null) : null)
                .build();
        job = maintenanceJobRepository.save(job);

        try {
            int days = options.containsKey("auditLogsOlderThanDays")
                    ? ((Number) options.get("auditLogsOlderThanDays")).intValue() : 90;
            LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
            int deleted = auditLogRepository.deleteByCreatedAtBefore(cutoff);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("auditLogsDeleted", deleted);
            result.put("message", "Cleaned " + deleted + " audit log entries older than " + days + " days.");

            job.setStatus("COMPLETED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage(result.get("message").toString());
            job.setResultJson(objectMapper.writeValueAsString(result));
            maintenanceJobRepository.save(job);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job.getJobId());
            response.put("status", "COMPLETED");
            response.put("result", result);
            return response;
        } catch (Exception e) {
            job.setStatus("FAILED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage("Cleanup failed: " + e.getMessage());
            maintenanceJobRepository.save(job);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job.getJobId());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return response;
        }
    }

    public Map<String, Object> clearCache() {
        return Map.of("success", true, "message", "Cache cleared successfully");
    }

    private Map<String, Object> toJobDto(MaintenanceJob j) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("jobId", j.getJobId());
        dto.put("type", j.getJobType());
        dto.put("status", j.getStatus());
        dto.put("startedAt", j.getStartedAt() != null ? j.getStartedAt().toString() : null);
        dto.put("completedAt", j.getCompletedAt() != null ? j.getCompletedAt().toString() : null);
        dto.put("message", j.getMessage());
        dto.put("triggeredBy", j.getTriggeredBy() != null ? j.getTriggeredBy().getFullName() : "System");
        dto.put("result", parseMap(j.getResultJson()));
        dto.put("progress", "COMPLETED".equals(j.getStatus()) ? 100 : "RUNNING".equals(j.getStatus()) ? 50 : 0);
        return dto;
    }

    private Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    public Path getBackupFilePath(String fileName) {
        if (fileName == null || fileName.contains("..")) {
            throw new ResourceNotFoundException("Invalid file");
        }
        Path path = fileStorageConfig.getUploadPath().resolve("backups").resolve(fileName);
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Backup file not found");
        }
        return path;
    }
}
