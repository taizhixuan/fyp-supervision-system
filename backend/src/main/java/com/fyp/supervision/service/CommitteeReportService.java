package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.GeneratedReport;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.GeneratedReportRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.report.CsvReportRenderer;
import com.fyp.supervision.service.report.PdfReportRenderer;
import com.fyp.supervision.service.report.ReportFormat;
import com.fyp.supervision.service.report.XlsxReportRenderer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommitteeReportService {

    private static final List<String> TYPES = List.of(
            "PAIRING_STATUS", "SUPERVISOR_LOAD", "PROPOSAL_SUMMARY",
            "MEETING_LOG_COMPLIANCE", "RISK_ASSESSMENT");

    private final CommitteeService committeeService;
    private final ProjectProgressService projectProgressService;
    private final MeetingLogComplianceService meetingLogComplianceService;
    private final GeneratedReportRepository generatedReportRepository;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageConfig fileStorageConfig;
    private final CsvReportRenderer csv;
    private final XlsxReportRenderer xlsx;
    private final PdfReportRenderer pdf;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> getReportDtos() {
        return generatedReportRepository.findAllByOrderByGeneratedAtDesc().stream()
                .map(this::toReportDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> generateReport(Long userId, Map<String, Object> config) throws IOException {
        String reportType = (String) config.getOrDefault("reportType", "PROPOSAL_SUMMARY");
        if (!TYPES.contains(reportType)) reportType = "PROPOSAL_SUMMARY";
        ReportFormat format = ReportFormat.parse((String) config.getOrDefault("format", "CSV"));
        String title = (String) config.getOrDefault("title", reportType + " · " + LocalDate.now());
        @SuppressWarnings("unchecked")
        Map<String, Object> filters = config.get("filters") instanceof Map
                ? (Map<String, Object>) config.get("filters") : Map.of();

        UserAccount generatedBy = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GeneratedReport report = GeneratedReport.builder()
                .reportType(reportType)
                .title(title)
                .generatedBy(generatedBy)
                .generatedAt(LocalDateTime.now())
                .format(format.name())
                .status("COMPLETED")
                .filtersJson(objectMapper.writeValueAsString(filters))
                .expiresAt(LocalDateTime.now().plusMonths(3))
                .build();
        report = generatedReportRepository.save(report);

        byte[] bytes;
        try {
            bytes = buildBytes(reportType, format, filters);
        } catch (Exception e) {
            report.setStatus("FAILED");
            generatedReportRepository.save(report);
            throw new IOException("Failed to render report: " + e.getMessage(), e);
        }

        Path reportsDir = fileStorageConfig.getUploadPath().resolve("reports");
        Files.createDirectories(reportsDir);
        Path filePath = reportsDir.resolve(report.getReportId() + "." + format.extension);
        Files.write(filePath, bytes);

        report.setFilePath("reports/" + report.getReportId() + "." + format.extension);
        report.setFileSize((long) bytes.length);
        report = generatedReportRepository.save(report);

        return toReportDto(report);
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

    public ReportFormat getReportFormat(Long reportId) {
        return generatedReportRepository.findById(reportId)
                .map(r -> ReportFormat.parse(r.getFormat()))
                .orElse(ReportFormat.CSV);
    }

    @Transactional
    public void deleteReport(Long reportId) throws IOException {
        GeneratedReport report = generatedReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getFilePath() != null && !report.getFilePath().isBlank()) {
            Path path = fileStorageConfig.getUploadPath().resolve(report.getFilePath());
            if (Files.exists(path)) Files.delete(path);
        }
        generatedReportRepository.delete(report);
    }

    private Map<String, Object> toReportDto(GeneratedReport r) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("reportId", r.getReportId());
        dto.put("reportType", r.getReportType());
        dto.put("title", r.getTitle());
        dto.put("status", r.getStatus() != null ? r.getStatus() : "COMPLETED");
        dto.put("generatedBy", r.getGeneratedBy() != null ? r.getGeneratedBy().getFullName() : "");
        dto.put("generatedAt", r.getGeneratedAt() != null ? r.getGeneratedAt().toString() : "");
        dto.put("format", r.getFormat());
        dto.put("fileSize", r.getFileSize() != null ? r.getFileSize() : 0);
        dto.put("downloadUrl", "/api/committee/reports/" + r.getReportId() + "/download");
        dto.put("filters", r.getFiltersJson() != null ? parseFilters(r.getFiltersJson()) : Map.of());
        dto.put("expiresAt", r.getExpiresAt() != null ? r.getExpiresAt().toString() : null);
        return dto;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseFilters(String json) {
        try { return objectMapper.readValue(json, Map.class); }
        catch (Exception e) { return Map.of(); }
    }

    // ===== builders per report type =====

    private byte[] buildBytes(String reportType, ReportFormat format, Map<String, Object> filters) {
        return switch (reportType) {
            case "SUPERVISOR_LOAD" -> render(format, "Supervisor Load · " + LocalDate.now(),
                    chips(filters),
                    supervisorLoadHeaders(), supervisorLoadKeys(), supervisorLoadRows(filters));
            case "PAIRING_STATUS" -> render(format, "Pairing Status · " + LocalDate.now(),
                    chips(filters),
                    pairingHeaders(), pairingKeys(), pairingRows(filters));
            case "MEETING_LOG_COMPLIANCE" -> render(format, "Meeting Log Compliance · " + LocalDate.now(),
                    chips(filters),
                    complianceHeaders(), complianceKeys(), complianceRows(filters));
            case "RISK_ASSESSMENT" -> render(format, "Risk Assessment · " + LocalDate.now(),
                    chips(filters),
                    riskHeaders(), riskKeys(), riskRows(filters));
            default -> render(format, "Proposal Summary · " + LocalDate.now(),
                    chips(filters),
                    proposalHeaders(), proposalKeys(), proposalRows(filters));
        };
    }

    private byte[] render(ReportFormat format, String title, Map<String, String> chips,
                          List<String> headers, List<String> keys, List<Map<String, Object>> rows) {
        return switch (format) {
            case CSV -> csv.render(headers, rows, keys);
            case XLSX -> xlsx.render(title, headers, rows, keys);
            case PDF -> pdf.render(title, chips, headers, rows, keys);
        };
    }

    private Map<String, String> chips(Map<String, Object> filters) {
        Map<String, String> chips = new LinkedHashMap<>();
        filters.forEach((k, v) -> { if (v != null) chips.put(k, v.toString()); });
        return chips;
    }

    private Long cycleIdOf(Map<String, Object> filters) {
        Object v = filters.get("cycleId");
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    // --- PAIRING_STATUS
    private List<String> pairingHeaders() { return List.of("Project ID","Title","Student","Student ID","Supervisor","Pairing","Project Status","Proposal Status","Cycle"); }
    private List<String> pairingKeys() { return List.of("projectId","title","studentName","studentId","supervisorName","pairingStatus","projectStatus","proposalStatus","cycleCode"); }
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> pairingRows(Map<String, Object> filters) {
        Map<String, Object> page = committeeService.getProjectDtos(
                cycleIdOf(filters), (String) filters.get("cycleStatus"),
                (String) filters.get("projectStatus"), (String) filters.get("pairingStatus"),
                null, null, PageRequest.of(0, 5000));
        return (List<Map<String, Object>>) page.getOrDefault("content", List.of());
    }

    // --- SUPERVISOR_LOAD
    private List<String> supervisorLoadHeaders() { return List.of("Supervisor ID","Name","Email","Department","Current","Max","FYP1","FYP2","Utilization %","Overloaded"); }
    private List<String> supervisorLoadKeys() { return List.of("supervisorId","fullName","email","department","currentLoad","maxCapacity","fyp1Students","fyp2Students","utilizationRate","isOverloaded"); }
    private List<Map<String, Object>> supervisorLoadRows(Map<String, Object> filters) {
        return committeeService.getSupervisorLoadDtos();
    }

    // --- PROPOSAL_SUMMARY (uses existing proposal DTOs)
    private List<String> proposalHeaders() { return List.of("Proposal ID","Student","Student ID","Supervisor","Status","Submitted"); }
    private List<String> proposalKeys() { return List.of("proposalId","studentName","studentId","supervisorName","status","submittedAt"); }
    private List<Map<String, Object>> proposalRows(Map<String, Object> filters) {
        return committeeService.getProposalDtos(null, PageRequest.of(0, 5000));
    }

    // --- MEETING_LOG_COMPLIANCE
    private List<String> complianceHeaders() { return List.of("Project ID","Student","Student ID","Cycle","Phase","Logs Completed","Logs Required","Meets Minimum"); }
    private List<String> complianceKeys() { return List.of("projectId","studentName","studentId","cycleCode","phase","logsCompleted","logsRequired","meetsMinimum"); }
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> complianceRows(Map<String, Object> filters) {
        Map<String, Object> page = committeeService.getProjectDtos(
                cycleIdOf(filters), (String) filters.get("cycleStatus"),
                null, null, null, null, PageRequest.of(0, 5000));
        List<Map<String, Object>> rows = (List<Map<String, Object>>) page.getOrDefault("content", List.of());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            String phase = String.valueOf(r.getOrDefault("cycleType", "FYP1"));
            Long studentUserId = null;
            // studentId in DTO is mmuId; need userId — find by mmuId via userAccountRepository
            Object studentMmu = r.get("studentId");
            if (studentMmu != null) {
                studentUserId = userAccountRepository.findByMmuId(studentMmu.toString())
                        .map(UserAccount::getUserId).orElse(null);
            }
            int completed = studentUserId != null
                    ? meetingLogComplianceService.completedLogCount(studentUserId, phase) : 0;
            int required = meetingLogComplianceService.requiredLogCount(phase);
            Map<String, Object> row = new LinkedHashMap<>(r);
            row.put("phase", phase);
            row.put("logsCompleted", completed);
            row.put("logsRequired", required);
            row.put("meetsMinimum", completed >= required);
            out.add(row);
        }
        return out;
    }

    // --- RISK_ASSESSMENT
    private List<String> riskHeaders() { return List.of("Project ID","Title","Student","Student ID","Supervisor","Risk","Reasons","Cycle"); }
    private List<String> riskKeys() { return List.of("projectId","title","studentName","studentId","supervisorName","riskLevel","riskFactorsCsv","cycleCode"); }
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> riskRows(Map<String, Object> filters) {
        Map<String, Object> page = committeeService.getProjectDtos(
                cycleIdOf(filters), (String) filters.get("cycleStatus"),
                null, null, null, null, PageRequest.of(0, 5000));
        List<Map<String, Object>> rows = (List<Map<String, Object>>) page.getOrDefault("content", List.of());
        rows.removeIf(r -> "LOW".equalsIgnoreCase((String) r.get("riskLevel")));
        for (Map<String, Object> r : rows) {
            Object factors = r.get("riskFactors");
            r.put("riskFactorsCsv", factors instanceof List<?> l
                    ? String.join("; ", l.stream().map(Object::toString).toList()) : "");
        }
        return rows;
    }
}
