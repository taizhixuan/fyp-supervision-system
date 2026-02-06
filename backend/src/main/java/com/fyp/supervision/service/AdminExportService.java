package com.fyp.supervision.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.ExportConfig;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ExportConfigRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
public class AdminExportService {

    private final ExportConfigRepository exportConfigRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProjectRepository projectRepository;
    private final AdminService adminService;
    private final FileStorageConfig fileStorageConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> getConfigDtos() {
        return exportConfigRepository.findAll().stream()
                .map(this::toConfigDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> createConfig(Map<String, Object> data) {
        ExportConfig config = mapToEntity(data);
        config.setConfigId(null);
        if (config.getIncludeHeaders() == null) config.setIncludeHeaders(true);
        if (config.getFormat() == null || config.getFormat().isBlank()) config.setFormat("CSV");
        config = exportConfigRepository.save(config);
        return toConfigDto(config);
    }

    public Map<String, Object> updateConfig(Long id, Map<String, Object> data) {
        ExportConfig config = exportConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Export config not found"));
        mapToEntity(data, config);
        config = exportConfigRepository.save(config);
        return toConfigDto(config);
    }

    public void deleteConfig(Long id) {
        if (!exportConfigRepository.existsById(id)) {
            throw new ResourceNotFoundException("Export config not found");
        }
        exportConfigRepository.deleteById(id);
    }

    public Map<String, Object> runExport(Long configId) throws IOException {
        ExportConfig config = exportConfigRepository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("Export config not found"));

        String csv = buildCsv(config);
        Path exportDir = fileStorageConfig.getUploadPath().resolve("exports");
        Files.createDirectories(exportDir);
        String fileName = configId + "_" + System.currentTimeMillis() + ".csv";
        Path filePath = exportDir.resolve(fileName);
        Files.writeString(filePath, csv, StandardCharsets.UTF_8);

        String relativePath = "exports/" + fileName;
        config.setLastExportPath(relativePath);
        config.setLastExportAt(LocalDateTime.now());
        exportConfigRepository.save(config);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("downloadUrl", "/api/admin/export-configs/" + configId + "/download");
        return result;
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
        dto.put("lastExportAt", c.getLastExportAt() != null ? c.getLastExportAt().toString() : null);
        return dto;
    }

    private ExportConfig mapToEntity(Map<String, Object> data) {
        return mapToEntity(data, new ExportConfig());
    }

    private void mapToEntity(Map<String, Object> data, ExportConfig config) {
        if (data.containsKey("name")) config.setName((String) data.get("name"));
        if (data.containsKey("dataType")) config.setDataType((String) data.get("dataType"));
        if (data.containsKey("format")) config.setFormat((String) data.get("format"));
        if (data.containsKey("includeHeaders")) config.setIncludeHeaders(Boolean.TRUE.equals(data.get("includeHeaders")));
        if (data.containsKey("dateFormat")) config.setDateFormat((String) data.get("dateFormat"));
        if (data.containsKey("fields")) config.setFieldsJson(writeJson(data.get("fields")));
        if (data.containsKey("filters")) config.setFiltersJson(writeJson(data.get("filters")));
        if (data.containsKey("schedule")) config.setScheduleJson(writeJson(data.get("schedule")));
    }

    private String buildCsv(ExportConfig config) throws IOException {
        List<String> fields = parseStringList(config.getFieldsJson());
        if (fields.isEmpty()) {
            fields = getDefaultFields(config.getDataType());
        }

        StringBuilder sb = new StringBuilder();
        if (Boolean.TRUE.equals(config.getIncludeHeaders())) {
            sb.append(String.join(",", fields.stream().map(this::escapeCsv).toList())).append("\n");
        }

        switch (config.getDataType().toUpperCase()) {
            case "USERS" -> appendUsersCsv(sb, fields);
            case "PROJECTS" -> appendProjectsCsv(sb, fields);
            default -> appendUsersCsv(sb, fields);
        }
        return sb.toString();
    }

    private void appendUsersCsv(StringBuilder sb, List<String> fields) {
        List<UserAccount> users = userAccountRepository.findAll(PageRequest.of(0, 10000)).getContent();
        for (UserAccount u : users) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", u.getUserId());
            row.put("email", u.getEmail());
            row.put("fullName", u.getFullName());
            row.put("role", u.getRole().name());
            row.put("status", u.getStatus().name());
            row.put("mmuId", u.getMmuId());
            row.put("phone", u.getPhone());
            row.put("lastLoginAt", u.getLastLoginAt() != null ? u.getLastLoginAt().toString() : "");
            row.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            appendRow(sb, fields, row);
        }
    }

    private void appendProjectsCsv(StringBuilder sb, List<String> fields) {
        List<Project> projects = projectRepository.findAll(PageRequest.of(0, 10000)).getContent();
        for (Project p : projects) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("projectId", p.getProjectId());
            row.put("title", p.getProjectTitle());
            row.put("status", p.getStatus().name());
            row.put("studentId", p.getStudent() != null ? p.getStudent().getUserId() : "");
            row.put("studentName", p.getStudent() != null ? p.getStudent().getFullName() : "");
            row.put("supervisorId", p.getSupervisor() != null ? p.getSupervisor().getUserId() : "");
            row.put("supervisorName", p.getSupervisor() != null ? p.getSupervisor().getFullName() : "");
            row.put("registeredAt", p.getRegisteredAt() != null ? p.getRegisteredAt().toString() : "");
            row.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : "");
            appendRow(sb, fields, row);
        }
    }

    private void appendRow(StringBuilder sb, List<String> fields, Map<String, Object> row) {
        List<String> values = fields.stream()
                .map(f -> row.getOrDefault(f, ""))
                .map(Object::toString)
                .map(this::escapeCsv)
                .toList();
        sb.append(String.join(",", values)).append("\n");
    }

    private List<String> getDefaultFields(String dataType) {
        return switch (dataType.toUpperCase()) {
            case "PROJECTS" -> List.of("projectId", "title", "status", "studentName", "supervisorName", "registeredAt");
            default -> List.of("userId", "email", "fullName", "role", "status", "lastLoginAt", "createdAt");
        };
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
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
