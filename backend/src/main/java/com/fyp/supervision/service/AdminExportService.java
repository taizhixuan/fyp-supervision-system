package com.fyp.supervision.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.*;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminExportService {

    private final ExportConfigRepository exportConfigRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogRepository meetingLogRepository;
    private final AnnouncementRepository announcementRepository;
    private final AuditLogRepository auditLogRepository;
    private final FileStorageConfig fileStorageConfig;

    private final ObjectMapper objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    private static final List<String> SUPPORTED_TYPES = List.of(
            "USERS", "PROJECTS", "PROPOSALS", "MEETINGS", "MEETING_LOGS", "ANNOUNCEMENTS", "AUDIT_LOGS");
    private static final List<String> SUPPORTED_FORMATS = List.of("CSV", "JSON", "XLSX");

    // ============================================
    // CRUD
    // ============================================

    public List<Map<String, Object>> getConfigDtos() {
        return exportConfigRepository.findAll().stream()
                .sorted(Comparator.comparing(ExportConfig::getCreatedAt).reversed())
                .map(this::toConfigDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createConfig(Long actorUserId, Map<String, Object> data) {
        ExportConfig config = new ExportConfig();
        mapToEntity(data, config);
        normaliseDefaults(config);
        if (actorUserId != null) {
            userAccountRepository.findById(actorUserId).ifPresent(config::setCreatedBy);
        }
        config.setNextRunAt(computeNextRunAt(config));
        config = exportConfigRepository.save(config);
        audit(actorUserId, "CREATE", config, "Created export configuration");
        return toConfigDto(config);
    }

    @Transactional
    public Map<String, Object> updateConfig(Long actorUserId, Long id, Map<String, Object> data) {
        ExportConfig config = exportConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Export config not found"));
        mapToEntity(data, config);
        normaliseDefaults(config);
        config.setNextRunAt(computeNextRunAt(config));
        config = exportConfigRepository.save(config);
        audit(actorUserId, "UPDATE", config, "Updated export configuration");
        return toConfigDto(config);
    }

    @Transactional
    public void deleteConfig(Long actorUserId, Long id) {
        ExportConfig config = exportConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Export config not found"));
        audit(actorUserId, "DELETE", config, "Deleted export configuration");
        exportConfigRepository.delete(config);
    }

    // ============================================
    // Run
    // ============================================

    @Transactional
    public Map<String, Object> runExport(Long actorUserId, Long configId) throws IOException {
        ExportConfig config = exportConfigRepository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("Export config not found"));
        runInternal(config, actorUserId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("downloadUrl", "/api/admin/export-configs/" + configId + "/download");
        result.put("fileName", fileNameForConfig(config));
        result.put("lastExportAt", config.getLastExportAt() != null ? config.getLastExportAt().toString() : null);
        return result;
    }

    /**
     * Build, persist, and stamp the export. Used by both manual /run and the scheduler.
     */
    @Transactional
    public void runInternal(ExportConfig config, Long actorUserId) throws IOException {
        String format = (config.getFormat() != null ? config.getFormat() : "CSV").toUpperCase(Locale.ROOT);
        String dataType = (config.getDataType() != null ? config.getDataType() : "USERS").toUpperCase(Locale.ROOT);
        List<String> fields = effectiveFields(dataType, parseStringList(config.getFieldsJson()));
        List<Map<String, Object>> rows = collectRows(dataType, parseMap(config.getFiltersJson()));

        String extension = extensionFor(format);
        Path exportDir = fileStorageConfig.getUploadPath().resolve("exports");
        Files.createDirectories(exportDir);
        String fileName = config.getConfigId() + "_" + System.currentTimeMillis() + extension;
        Path filePath = exportDir.resolve(fileName);

        boolean includeHeaders = !Boolean.FALSE.equals(config.getIncludeHeaders());
        switch (format) {
            case "JSON" -> writeJsonFile(filePath, fields, rows);
            case "XLSX" -> writeXlsxFile(filePath, fields, rows, includeHeaders);
            default -> writeCsvFile(filePath, fields, rows, includeHeaders);
        }

        config.setLastExportPath("exports/" + fileName);
        config.setLastExportAt(LocalDateTime.now());
        config.setNextRunAt(computeNextRunAt(config));
        exportConfigRepository.save(config);

        Long sizeBytes = Files.size(filePath);
        String detail = String.format("%s %s export (%d rows, %d bytes)", dataType, format, rows.size(), sizeBytes);
        audit(actorUserId, "EXPORT", config, detail);
    }

    public Path getExportFilePath(Long configId) {
        ExportConfig config = exportConfigRepository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("Export config not found"));
        if (config.getLastExportPath() == null || config.getLastExportPath().isBlank()) {
            throw new ResourceNotFoundException("No export file available. Run export first.");
        }
        Path path = fileStorageConfig.getUploadPath().resolve(config.getLastExportPath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Export file not found");
        }
        return path;
    }

    public String contentTypeFor(ExportConfig config) {
        String format = (config.getFormat() != null ? config.getFormat() : "CSV").toUpperCase(Locale.ROOT);
        return switch (format) {
            case "JSON" -> "application/json";
            case "XLSX" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            default -> "text/csv";
        };
    }

    public String fileNameForConfig(ExportConfig config) {
        String safe = config.getName() == null ? "export" : config.getName().replaceAll("[^A-Za-z0-9_-]+", "_");
        return safe + extensionFor((config.getFormat() != null ? config.getFormat() : "CSV").toUpperCase(Locale.ROOT));
    }

    // ============================================
    // Schedule
    // ============================================

    public List<ExportConfig> findDueConfigs(LocalDateTime now) {
        return exportConfigRepository.findByNextRunAtLessThanEqualOrderByNextRunAtAsc(now);
    }

    private LocalDateTime computeNextRunAt(ExportConfig config) {
        Map<String, Object> schedule = parseMap(config.getScheduleJson());
        if (schedule.isEmpty() || !Boolean.TRUE.equals(schedule.get("enabled"))) return null;
        String frequency = String.valueOf(schedule.getOrDefault("frequency", "DAILY")).toUpperCase(Locale.ROOT);
        LocalTime time = parseTime(String.valueOf(schedule.getOrDefault("time", "06:00")));
        LocalDateTime base = config.getLastExportAt() != null ? config.getLastExportAt() : LocalDateTime.now();
        return switch (frequency) {
            case "WEEKLY" -> {
                int dow = toInt(schedule.get("dayOfWeek"), 1); // 0=Sunday … 6=Saturday
                DayOfWeek targetDow = isoDayOfWeek(dow);
                LocalDateTime candidate = LocalDateTime.of(base.toLocalDate(), time).with(TemporalAdjusters.nextOrSame(targetDow));
                if (!candidate.isAfter(LocalDateTime.now())) candidate = candidate.plusWeeks(1);
                yield candidate;
            }
            case "MONTHLY" -> {
                int dom = Math.max(1, Math.min(28, toInt(schedule.get("dayOfMonth"), 1)));
                LocalDateTime candidate = LocalDateTime.of(base.toLocalDate().withDayOfMonth(dom), time);
                if (!candidate.isAfter(LocalDateTime.now())) candidate = candidate.plusMonths(1).withDayOfMonth(dom);
                yield candidate;
            }
            default -> { // DAILY
                LocalDateTime candidate = LocalDateTime.of(LocalDate.now(), time);
                if (!candidate.isAfter(LocalDateTime.now())) candidate = candidate.plusDays(1);
                yield candidate;
            }
        };
    }

    private DayOfWeek isoDayOfWeek(int sundayBased) {
        // Schedule UI uses 0=Sunday..6=Saturday; convert to java.time.DayOfWeek (1=Monday..7=Sunday).
        return switch (sundayBased) {
            case 0 -> DayOfWeek.SUNDAY;
            case 1 -> DayOfWeek.MONDAY;
            case 2 -> DayOfWeek.TUESDAY;
            case 3 -> DayOfWeek.WEDNESDAY;
            case 4 -> DayOfWeek.THURSDAY;
            case 5 -> DayOfWeek.FRIDAY;
            case 6 -> DayOfWeek.SATURDAY;
            default -> DayOfWeek.MONDAY;
        };
    }

    private LocalTime parseTime(String hhmm) {
        try {
            String[] parts = hhmm.split(":");
            return LocalTime.of(Integer.parseInt(parts[0]), parts.length > 1 ? Integer.parseInt(parts[1]) : 0);
        } catch (Exception e) {
            return LocalTime.of(6, 0);
        }
    }

    // ============================================
    // Row collectors
    // ============================================

    private List<Map<String, Object>> collectRows(String dataType, Map<String, Object> filters) {
        return switch (dataType) {
            case "PROJECTS" -> projectRows(filters);
            case "PROPOSALS" -> proposalRows(filters);
            case "MEETINGS" -> meetingRows(filters);
            case "MEETING_LOGS" -> meetingLogRows(filters);
            case "ANNOUNCEMENTS" -> announcementRows(filters);
            case "AUDIT_LOGS" -> auditLogRows(filters);
            default -> userRows(filters);
        };
    }

    private List<Map<String, Object>> userRows(Map<String, Object> filters) {
        String role = stringFilter(filters, "role");
        String status = stringFilter(filters, "status");
        return userAccountRepository.findAll(PageRequest.of(0, 100000)).getContent().stream()
                .filter(u -> role == null || role.equalsIgnoreCase(u.getRole() != null ? u.getRole().name() : ""))
                .filter(u -> status == null || status.equalsIgnoreCase(u.getStatus() != null ? u.getStatus().name() : ""))
                .map(u -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("userId", u.getUserId());
                    r.put("email", u.getEmail());
                    r.put("fullName", u.getFullName());
                    r.put("role", u.getRole() != null ? u.getRole().name() : "");
                    r.put("status", u.getStatus() != null ? u.getStatus().name() : "");
                    r.put("mmuId", u.getMmuId());
                    r.put("phone", u.getPhone());
                    String department = "";
                    if (u.getStudentProfile() != null && u.getStudentProfile().getFaculty() != null) {
                        department = u.getStudentProfile().getFaculty();
                    } else if (u.getSupervisorProfile() != null && u.getSupervisorProfile().getDepartment() != null) {
                        department = u.getSupervisorProfile().getDepartment();
                    }
                    r.put("department", department);
                    r.put("lastLoginAt", u.getLastLoginAt() != null ? u.getLastLoginAt().toString() : "");
                    r.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
                    return r;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> projectRows(Map<String, Object> filters) {
        String status = stringFilter(filters, "status");
        return projectRepository.findAll(PageRequest.of(0, 100000)).getContent().stream()
                .filter(p -> status == null || (p.getStatus() != null && status.equalsIgnoreCase(p.getStatus().name())))
                .map(p -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("projectId", p.getProjectId());
                    r.put("title", p.getProjectTitle());
                    r.put("status", p.getStatus() != null ? p.getStatus().name() : "");
                    r.put("studentId", p.getStudent() != null ? p.getStudent().getUserId() : "");
                    r.put("studentName", p.getStudent() != null ? p.getStudent().getFullName() : "");
                    r.put("supervisorId", p.getSupervisor() != null ? p.getSupervisor().getUserId() : "");
                    r.put("supervisorName", p.getSupervisor() != null ? p.getSupervisor().getFullName() : "");
                    r.put("cycleCode", p.getCycle() != null ? p.getCycle().getCycleCode() : "");
                    r.put("registeredAt", p.getRegisteredAt() != null ? p.getRegisteredAt().toString() : "");
                    r.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : "");
                    return r;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> proposalRows(Map<String, Object> filters) {
        String status = stringFilter(filters, "status");
        return proposalRepository.findAll(PageRequest.of(0, 100000)).getContent().stream()
                .filter(p -> status == null || (p.getStatus() != null && status.equalsIgnoreCase(p.getStatus().name())))
                .map(p -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("proposalId", p.getProposalId());
                    r.put("title", p.getTitle());
                    r.put("status", p.getStatus() != null ? p.getStatus().name() : "");
                    r.put("currentVersion", p.getCurrentVersion());
                    r.put("studentId", p.getStudent() != null ? p.getStudent().getUserId() : "");
                    r.put("studentName", p.getStudent() != null ? p.getStudent().getFullName() : "");
                    r.put("supervisorId", p.getSupervisor() != null ? p.getSupervisor().getUserId() : "");
                    r.put("supervisorName", p.getSupervisor() != null ? p.getSupervisor().getFullName() : "");
                    r.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
                    r.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : "");
                    return r;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> meetingRows(Map<String, Object> filters) {
        String status = stringFilter(filters, "status");
        return meetingRepository.findAll(PageRequest.of(0, 100000)).getContent().stream()
                .filter(m -> status == null || (m.getStatus() != null && status.equalsIgnoreCase(m.getStatus().name())))
                .map(m -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("meetingId", m.getMeetingId());
                    r.put("title", m.getTitle());
                    r.put("meetingType", m.getMeetingType());
                    r.put("status", m.getStatus() != null ? m.getStatus().name() : "");
                    r.put("platform", m.getPlatform());
                    r.put("scheduledStart", m.getConfirmedStartAt() != null ? m.getConfirmedStartAt().toString()
                            : (m.getProposedStartAt() != null ? m.getProposedStartAt().toString() : ""));
                    r.put("scheduledEnd", m.getConfirmedEndAt() != null ? m.getConfirmedEndAt().toString()
                            : (m.getProposedEndAt() != null ? m.getProposedEndAt().toString() : ""));
                    r.put("durationMinutes", m.getDurationMinutes());
                    r.put("studentName", m.getProject() != null && m.getProject().getStudent() != null ? m.getProject().getStudent().getFullName() : "");
                    r.put("supervisorName", m.getProject() != null && m.getProject().getSupervisor() != null ? m.getProject().getSupervisor().getFullName() : "");
                    return r;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> meetingLogRows(Map<String, Object> filters) {
        String status = stringFilter(filters, "status");
        return meetingLogRepository.findAll(PageRequest.of(0, 100000)).getContent().stream()
                .filter(l -> status == null || (l.getStatus() != null && status.equalsIgnoreCase(l.getStatus().name())))
                .map(l -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("logId", l.getLogId());
                    r.put("meetingDate", l.getMeetingDate() != null ? l.getMeetingDate().toString() : "");
                    r.put("meetingNumber", l.getMeetingNumber());
                    r.put("fypPhase", l.getFypPhase());
                    r.put("status", l.getStatus() != null ? l.getStatus().name() : "");
                    r.put("studentName", l.getStudent() != null ? l.getStudent().getFullName() : "");
                    r.put("supervisorName", l.getSupervisor() != null ? l.getSupervisor().getFullName() : "");
                    r.put("submittedAt", l.getSubmittedAt() != null ? l.getSubmittedAt().toString() : "");
                    r.put("lockedAt", l.getLockedAt() != null ? l.getLockedAt().toString() : "");
                    return r;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> announcementRows(Map<String, Object> filters) {
        String scope = stringFilter(filters, "scope");
        return announcementRepository.findAll(PageRequest.of(0, 100000)).getContent().stream()
                .filter(a -> scope == null || (a.getScope() != null && scope.equalsIgnoreCase(a.getScope())))
                .map(a -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("announcementId", a.getAnnouncementId());
                    r.put("title", a.getTitle());
                    r.put("scope", a.getScope());
                    r.put("priority", a.getPriority());
                    r.put("status", a.getStatus() != null ? a.getStatus().name() : "");
                    r.put("createdBy", a.getCreatedBy() != null ? a.getCreatedBy().getFullName() : "");
                    r.put("publishAt", a.getPublishAt() != null ? a.getPublishAt().toString() : "");
                    r.put("expiresAt", a.getExpiresAt() != null ? a.getExpiresAt().toString() : "");
                    r.put("viewCount", a.getViewCount());
                    return r;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> auditLogRows(Map<String, Object> filters) {
        String action = stringFilter(filters, "action");
        return auditLogRepository.findAll(PageRequest.of(0, 100000)).getContent().stream()
                .filter(l -> action == null || (l.getAction() != null && action.equalsIgnoreCase(l.getAction())))
                .map(l -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("auditId", l.getAuditId());
                    r.put("action", l.getAction());
                    r.put("entityName", l.getEntityName());
                    r.put("entityId", l.getEntityId());
                    r.put("user", l.getUser() != null ? l.getUser().getFullName() : "");
                    r.put("details", l.getDetails());
                    r.put("ipAddress", l.getIpAddress());
                    r.put("timestamp", l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
                    return r;
                })
                .collect(Collectors.toList());
    }

    private String stringFilter(Map<String, Object> filters, String key) {
        Object v = filters.get(key);
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    // ============================================
    // File writers
    // ============================================

    private void writeCsvFile(Path filePath, List<String> fields, List<Map<String, Object>> rows, boolean includeHeaders) throws IOException {
        StringBuilder sb = new StringBuilder();
        if (includeHeaders) {
            sb.append(String.join(",", fields.stream().map(this::escapeCsv).toList())).append("\n");
        }
        for (Map<String, Object> row : rows) {
            List<String> values = fields.stream()
                    .map(f -> Objects.toString(row.getOrDefault(f, ""), ""))
                    .map(this::escapeCsv)
                    .toList();
            sb.append(String.join(",", values)).append("\n");
        }
        Files.writeString(filePath, sb.toString(), StandardCharsets.UTF_8);
    }

    private void writeJsonFile(Path filePath, List<String> fields, List<Map<String, Object>> rows) throws IOException {
        List<Map<String, Object>> filtered = rows.stream().map(row -> {
            Map<String, Object> out = new LinkedHashMap<>();
            for (String f : fields) out.put(f, row.getOrDefault(f, null));
            return out;
        }).collect(Collectors.toList());
        Files.writeString(filePath, objectMapper.writeValueAsString(filtered), StandardCharsets.UTF_8);
    }

    private void writeXlsxFile(Path filePath, List<String> fields, List<Map<String, Object>> rows, boolean includeHeaders) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); OutputStream out = Files.newOutputStream(filePath)) {
            Sheet sheet = workbook.createSheet("Export");
            int rowIdx = 0;
            if (includeHeaders) {
                Row header = sheet.createRow(rowIdx++);
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerStyle.setFont(headerFont);
                for (int c = 0; c < fields.size(); c++) {
                    Cell cell = header.createCell(c);
                    cell.setCellValue(fields.get(c));
                    cell.setCellStyle(headerStyle);
                }
            }
            for (Map<String, Object> row : rows) {
                Row r = sheet.createRow(rowIdx++);
                for (int c = 0; c < fields.size(); c++) {
                    Object value = row.getOrDefault(fields.get(c), "");
                    Cell cell = r.createCell(c);
                    if (value instanceof Number n) cell.setCellValue(n.doubleValue());
                    else if (value instanceof Boolean b) cell.setCellValue(b);
                    else cell.setCellValue(Objects.toString(value, ""));
                }
            }
            for (int c = 0; c < fields.size(); c++) sheet.autoSizeColumn(c);
            workbook.write(out);
        }
    }

    private String extensionFor(String format) {
        return switch (format) {
            case "JSON" -> ".json";
            case "XLSX" -> ".xlsx";
            default -> ".csv";
        };
    }

    // ============================================
    // Mapping + utils
    // ============================================

    private Map<String, Object> toConfigDto(ExportConfig c) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("configId", c.getConfigId());
        dto.put("name", c.getName());
        dto.put("dataType", c.getDataType());
        dto.put("format", c.getFormat());
        dto.put("includeHeaders", c.getIncludeHeaders());
        dto.put("dateFormat", c.getDateFormat() != null ? c.getDateFormat() : "yyyy-MM-dd");
        dto.put("fields", parseStringList(c.getFieldsJson()));
        dto.put("filters", parseMap(c.getFiltersJson()));
        dto.put("schedule", parseMap(c.getScheduleJson()));
        dto.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : "");
        dto.put("updatedAt", c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : "");
        dto.put("lastExportAt", c.getLastExportAt() != null ? c.getLastExportAt().toString() : null);
        dto.put("nextRunAt", c.getNextRunAt() != null ? c.getNextRunAt().toString() : null);
        dto.put("createdBy", c.getCreatedBy() != null ? c.getCreatedBy().getFullName() : null);
        return dto;
    }

    private void mapToEntity(Map<String, Object> data, ExportConfig config) {
        if (data.containsKey("name")) config.setName((String) data.get("name"));
        if (data.containsKey("dataType")) {
            String dt = String.valueOf(data.get("dataType")).toUpperCase(Locale.ROOT);
            if (!SUPPORTED_TYPES.contains(dt)) {
                throw new IllegalArgumentException("Unsupported dataType: " + dt + ". Supported: " + SUPPORTED_TYPES);
            }
            config.setDataType(dt);
        }
        if (data.containsKey("format")) {
            String fmt = String.valueOf(data.get("format")).toUpperCase(Locale.ROOT);
            if (!SUPPORTED_FORMATS.contains(fmt)) {
                throw new IllegalArgumentException("Unsupported format: " + fmt + ". Supported: " + SUPPORTED_FORMATS);
            }
            config.setFormat(fmt);
        }
        if (data.containsKey("includeHeaders")) config.setIncludeHeaders(Boolean.TRUE.equals(data.get("includeHeaders")));
        if (data.containsKey("dateFormat")) config.setDateFormat((String) data.get("dateFormat"));
        if (data.containsKey("fields")) config.setFieldsJson(writeJson(data.get("fields")));
        if (data.containsKey("filters")) config.setFiltersJson(writeJson(data.get("filters")));
        if (data.containsKey("schedule")) config.setScheduleJson(writeJson(data.get("schedule")));
    }

    private void normaliseDefaults(ExportConfig config) {
        if (config.getIncludeHeaders() == null) config.setIncludeHeaders(true);
        if (config.getFormat() == null || config.getFormat().isBlank()) config.setFormat("CSV");
        if (config.getDateFormat() == null) config.setDateFormat("yyyy-MM-dd");
    }

    private List<String> effectiveFields(String dataType, List<String> requested) {
        if (requested != null && !requested.isEmpty()) return requested;
        return defaultFields(dataType);
    }

    private List<String> defaultFields(String dataType) {
        return switch (dataType) {
            case "PROJECTS" -> List.of("projectId", "title", "status", "studentName", "supervisorName", "cycleCode", "registeredAt", "updatedAt");
            case "PROPOSALS" -> List.of("proposalId", "title", "status", "currentVersion", "studentName", "supervisorName", "createdAt", "updatedAt");
            case "MEETINGS" -> List.of("meetingId", "title", "meetingType", "status", "scheduledStart", "studentName", "supervisorName");
            case "MEETING_LOGS" -> List.of("logId", "meetingDate", "meetingNumber", "fypPhase", "status", "studentName", "supervisorName", "submittedAt", "lockedAt");
            case "ANNOUNCEMENTS" -> List.of("announcementId", "title", "scope", "priority", "status", "createdBy", "publishAt", "expiresAt", "viewCount");
            case "AUDIT_LOGS" -> List.of("auditId", "action", "entityName", "entityId", "user", "details", "ipAddress", "timestamp");
            default -> List.of("userId", "email", "fullName", "role", "status", "mmuId", "lastLoginAt", "createdAt");
        };
    }

    private void audit(Long actorUserId, String action, ExportConfig config, String details) {
        try {
            AuditLog log = new AuditLog();
            if (actorUserId != null) userAccountRepository.findById(actorUserId).ifPresent(log::setUser);
            log.setAction(action);
            log.setEntityName("EXPORT_CONFIG");
            log.setEntityId(config.getConfigId() != null ? config.getConfigId().toString() : null);
            log.setDetails(details + " — " + (config.getName() != null ? config.getName() : "") +
                    " (" + config.getDataType() + "/" + config.getFormat() + ")");
            log.setCreatedAt(LocalDateTime.now());
            auditLogRepository.save(log);
        } catch (Exception ignored) {
            // Audit failure must never block the actual export operation.
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private int toInt(Object v, int fallback) {
        if (v instanceof Number n) return n.intValue();
        if (v != null) {
            try { return Integer.parseInt(v.toString()); } catch (Exception ignored) {}
        }
        return fallback;
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return null;
        }
    }
}
