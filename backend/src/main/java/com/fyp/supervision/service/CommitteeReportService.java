package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.GeneratedReport;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.GeneratedReportRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommitteeReportService {

    private final CommitteeService committeeService;
    private final GeneratedReportRepository generatedReportRepository;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageConfig fileStorageConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> getReportDtos() {
        return generatedReportRepository.findAllByOrderByGeneratedAtDesc().stream()
                .map(this::toReportDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> generateReport(Long userId, Map<String, Object> config) throws IOException {
        String reportType = (String) config.getOrDefault("reportType", "PROPOSAL_SUMMARY");
        String format = (String) config.getOrDefault("format", "CSV");
        String title = (String) config.getOrDefault("title", reportType + " Report - " + LocalDateTime.now());
        Map<String, Object> filters = config.containsKey("filters") && config.get("filters") instanceof Map
                ? (Map<String, Object>) config.get("filters") : Map.of();

        UserAccount generatedBy = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GeneratedReport report = GeneratedReport.builder()
                .reportType(reportType)
                .title(title)
                .generatedBy(generatedBy)
                .generatedAt(LocalDateTime.now())
                .format(format.toUpperCase())
                .filtersJson(objectMapper.writeValueAsString(filters))
                .expiresAt(LocalDateTime.now().plusMonths(3))
                .build();
        report = generatedReportRepository.save(report);

        String csvContent = buildCsvReport(reportType, filters);
        Path reportsDir = fileStorageConfig.getUploadPath().resolve("reports");
        Files.createDirectories(reportsDir);
        Path filePath = reportsDir.resolve(report.getReportId() + ".csv");
        Files.writeString(filePath, csvContent, StandardCharsets.UTF_8);

        report.setFilePath("reports/" + report.getReportId() + ".csv");
        generatedReportRepository.save(report);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reportId", report.getReportId());
        result.put("downloadUrl", "/api/committee/reports/" + report.getReportId() + "/download");
        result.put("title", report.getTitle());
        result.put("generatedAt", report.getGeneratedAt().toString());
        return result;
    }

    public Path getReportFilePath(Long reportId) {
        GeneratedReport report = generatedReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getFilePath() == null || report.getFilePath().isBlank()) {
            throw new ResourceNotFoundException("Report file not found");
        }
        Path path = fileStorageConfig.getUploadPath().resolve(report.getFilePath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Report file not found");
        }
        return path;
    }

    @Transactional
    public void deleteReport(Long reportId) throws IOException {
        GeneratedReport report = generatedReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getFilePath() != null && !report.getFilePath().isBlank()) {
            Path path = fileStorageConfig.getUploadPath().resolve(report.getFilePath());
            if (Files.exists(path)) {
                Files.delete(path);
            }
        }
        generatedReportRepository.delete(report);
    }

    private Map<String, Object> toReportDto(GeneratedReport r) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("reportId", r.getReportId());
        dto.put("reportType", r.getReportType());
        dto.put("title", r.getTitle());
        dto.put("generatedBy", r.getGeneratedBy() != null ? r.getGeneratedBy().getFullName() : "");
        dto.put("generatedAt", r.getGeneratedAt() != null ? r.getGeneratedAt().toString() : "");
        dto.put("format", r.getFormat());
        dto.put("fileUrl", "/api/committee/reports/" + r.getReportId() + "/download");
        dto.put("filters", r.getFiltersJson() != null ? parseFilters(r.getFiltersJson()) : Map.of());
        dto.put("expiresAt", r.getExpiresAt() != null ? r.getExpiresAt().toString() : null);
        return dto;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseFilters(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private String buildCsvReport(String reportType, Map<String, Object> filters) {
        return switch (reportType) {
            case "SUPERVISOR_LOAD" -> buildSupervisorLoadCsv();
            case "PAIRING_STATUS" -> buildPairingStatusCsv(filters);
            default -> buildProposalSummaryCsv(filters);
        };
    }

    private String buildProposalSummaryCsv(Map<String, Object> filters) {
        List<Map<String, Object>> proposals = committeeService.getProposalDtos(null, PageRequest.of(0, 5000));
        StringBuilder sb = new StringBuilder();
        sb.append("proposalId,studentName,studentId,supervisorName,status,submittedAt\n");
        for (Map<String, Object> p : proposals) {
            sb.append(escapeCsv(p.get("proposalId"))).append(",");
            sb.append(escapeCsv(p.get("studentName"))).append(",");
            sb.append(escapeCsv(p.get("studentId"))).append(",");
            sb.append(escapeCsv(p.get("supervisorName"))).append(",");
            sb.append(escapeCsv(p.get("status"))).append(",");
            sb.append(escapeCsv(p.get("submittedAt"))).append("\n");
        }
        return sb.toString();
    }

    private String buildSupervisorLoadCsv() {
        List<Map<String, Object>> loads = committeeService.getSupervisorLoadDtos();
        StringBuilder sb = new StringBuilder();
        sb.append("supervisorId,fullName,email,currentLoad,maxCapacity,utilizationRate,isOverloaded\n");
        for (Map<String, Object> s : loads) {
            sb.append(escapeCsv(s.get("supervisorId"))).append(",");
            sb.append(escapeCsv(s.get("fullName"))).append(",");
            sb.append(escapeCsv(s.get("email"))).append(",");
            sb.append(escapeCsv(s.get("currentLoad"))).append(",");
            sb.append(escapeCsv(s.get("maxCapacity"))).append(",");
            sb.append(escapeCsv(s.get("utilizationRate"))).append(",");
            sb.append(escapeCsv(s.get("isOverloaded"))).append("\n");
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String buildPairingStatusCsv(Map<String, Object> filters) {
        Long cycleId = filters.containsKey("cycleId") && filters.get("cycleId") != null
                ? ((Number) filters.get("cycleId")).longValue() : null;
        Map<String, Object> result = committeeService.getProjectDtos(cycleId, PageRequest.of(0, 5000));
        List<Map<String, Object>> projects = (List<Map<String, Object>>) result.getOrDefault("content", List.of());
        StringBuilder sb = new StringBuilder();
        sb.append("projectId,title,studentName,studentId,supervisorName,pairingStatus,projectStatus,proposalStatus\n");
        for (Map<String, Object> p : projects) {
            sb.append(escapeCsv(p.get("projectId"))).append(",");
            sb.append(escapeCsv(p.get("title"))).append(",");
            sb.append(escapeCsv(p.get("studentName"))).append(",");
            sb.append(escapeCsv(p.get("studentId"))).append(",");
            sb.append(escapeCsv(p.get("supervisorName"))).append(",");
            sb.append(escapeCsv(p.get("pairingStatus"))).append(",");
            sb.append(escapeCsv(p.get("projectStatus"))).append(",");
            sb.append(escapeCsv(p.get("proposalStatus"))).append("\n");
        }
        return sb.toString();
    }

    private static String escapeCsv(Object value) {
        if (value == null) return "";
        String s = value.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
