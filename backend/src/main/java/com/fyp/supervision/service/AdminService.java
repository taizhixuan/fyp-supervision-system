package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.*;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final FypCycleRepository fypCycleRepository;
    private final DeadlineRepository deadlineRepository;
    private final SystemParameterRepository systemParameterRepository;
    private final IntegrationSettingRepository integrationSettingRepository;
    private final AuditLogRepository auditLogRepository;
    private final AiServiceClient aiServiceClient;
    private final FileStorageConfig fileStorageConfig;

    @PersistenceContext
    private EntityManager entityManager;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ========== Dashboard ==========

    public Map<String, Object> getDashboard() {
        long totalUsers = userAccountRepository.count();
        long totalStudents = userAccountRepository.countByRole(UserRole.STUDENT);
        long totalSupervisors = userAccountRepository.countByRole(UserRole.SUPERVISOR);
        long activeUsers = userAccountRepository.countByRoleAndStatus(UserRole.STUDENT, UserStatus.ACTIVE)
                + userAccountRepository.countByRoleAndStatus(UserRole.SUPERVISOR, UserStatus.ACTIVE)
                + userAccountRepository.countByRoleAndStatus(UserRole.FYP_COMMITTEE, UserStatus.ACTIVE)
                + userAccountRepository.countByRoleAndStatus(UserRole.SYSTEM_ADMIN, UserStatus.ACTIVE);
        long pendingApprovals = userAccountRepository.countByStatus(UserStatus.PENDING);
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE);
        long totalProjects = projectRepository.count();

        // Real JVM + disk metrics — replace the previous hardcoded zeros.
        Runtime rt = Runtime.getRuntime();
        long jvmTotalMb = rt.totalMemory() / (1024 * 1024);
        long jvmUsedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long jvmMaxMb = rt.maxMemory() / (1024 * 1024);
        int memoryPct = jvmMaxMb > 0 ? (int) Math.round(100.0 * jvmUsedMb / jvmMaxMb) : 0;

        java.lang.management.OperatingSystemMXBean osBean =
                java.lang.management.ManagementFactory.getOperatingSystemMXBean();
        // OS load average is the closest portable CPU signal across JDKs; normalise
        // to a 0..100 percentage of available cores. Returns -1 on platforms that
        // don't support it (most Windows JDKs) — fall back to 0 in that case.
        double load = osBean.getSystemLoadAverage();
        int cores = Math.max(1, osBean.getAvailableProcessors());
        int cpuPct = load < 0 ? 0 : (int) Math.min(100, Math.round(100.0 * load / cores));

        long storageUsedMb = 0;
        long storageTotalMb = 0;
        try {
            Path uploads = fileStorageConfig.getUploadPath();
            if (Files.exists(uploads)) {
                java.nio.file.FileStore fs = Files.getFileStore(uploads);
                storageTotalMb = fs.getTotalSpace() / (1024 * 1024);
                storageUsedMb  = (fs.getTotalSpace() - fs.getUsableSpace()) / (1024 * 1024);
            }
        } catch (java.io.IOException ignored) {
            // disk metrics unavailable — leave zero
        }

        long databaseSizeMb = 0;
        try {
            Object size = entityManager.createNativeQuery(
                    "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024) " +
                    "FROM information_schema.tables WHERE table_schema = DATABASE()"
            ).getSingleResult();
            if (size instanceof Number n) databaseSizeMb = n.longValue();
        } catch (Exception ignored) {
            // MySQL-specific query; ignore on other engines or insufficient privs
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("totalProjects", totalProjects);
        stats.put("activeProjects", activeProjects);
        stats.put("systemUptime", "Running");
        stats.put("lastBackup", lookupLastBackup());
        stats.put("storageUsed", storageUsedMb);
        stats.put("storageTotal", storageTotalMb);
        stats.put("cpuUsage", cpuPct);
        stats.put("memoryUsage", memoryPct);
        stats.put("databaseSize", databaseSizeMb);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("stats", stats);
        dashboard.put("alerts", List.of());
        dashboard.put("recentActivity", buildRecentActivityForDashboard());
        return dashboard;
    }

    /**
     * Most recent backup timestamp from the maintenance_job log, or null if there
     * has never been a successful backup.
     */
    private String lookupLastBackup() {
        try {
            Object result = entityManager.createNativeQuery(
                    "SELECT completed_at FROM maintenance_job " +
                    "WHERE job_type = 'BACKUP' AND status = 'COMPLETED' " +
                    "ORDER BY completed_at DESC LIMIT 1"
            ).getSingleResult();
            if (result == null) return null;
            return result.toString();
        } catch (Exception ignored) {
            return null;
        }
    }

    /** Latest 10 audit rows, mapped to the dashboard's RecentAdminActivity shape. */
    private List<Map<String, Object>> buildRecentActivityForDashboard() {
        return auditLogRepository
                .findWithFilters(null, null, null, null, null,
                        org.springframework.data.domain.PageRequest.of(0, 10))
                .getContent().stream()
                .map(this::buildAuditLogDto)
                .collect(Collectors.toList());
    }

    // ========== Users ==========

    public Map<String, Object> getUserList(String role, String status, String search, Long cycleId, Pageable pageable) {
        Page<UserAccount> page;
        // cycleId only applies to students (no other role enrols in a cycle).
        // When provided, it short-circuits the regular branches and implicitly
        // forces role=STUDENT via the cycle-scoped repository queries.
        if (cycleId != null) {
            if (search != null && !search.isBlank()) {
                page = userAccountRepository.searchStudentsByCycleAndTerm(cycleId, search, pageable);
            } else if (status != null && !status.isBlank() && !"ALL".equals(status)) {
                page = userAccountRepository.findStudentsByCycleAndStatus(cycleId, UserStatus.valueOf(status), pageable);
            } else {
                page = userAccountRepository.findStudentsByCycle(cycleId, pageable);
            }
        } else if (search != null && !search.isBlank()) {
            if (role != null && !role.isBlank() && !"ALL".equals(role)) {
                page = userAccountRepository.searchByRoleAndTerm(UserRole.valueOf(role), search, pageable);
            } else {
                page = userAccountRepository.searchByTerm(search, pageable);
            }
        } else if (role != null && !role.isBlank() && !"ALL".equals(role)
                && status != null && !status.isBlank() && !"ALL".equals(status)) {
            page = userAccountRepository.findByRoleAndStatus(UserRole.valueOf(role), UserStatus.valueOf(status), pageable);
        } else if (role != null && !role.isBlank() && !"ALL".equals(role)) {
            page = userAccountRepository.findByRole(UserRole.valueOf(role), pageable);
        } else if (status != null && !status.isBlank() && !"ALL".equals(status)) {
            page = userAccountRepository.findByStatus(UserStatus.valueOf(status), pageable);
        } else {
            page = userAccountRepository.findAll(pageable);
        }

        // Batch-fetch profiles for the page rather than firing one findById per row.
        List<Long> studentIds = page.getContent().stream()
                .filter(u -> u.getRole() == UserRole.STUDENT)
                .map(UserAccount::getUserId).toList();
        List<Long> supervisorIds = page.getContent().stream()
                .filter(u -> u.getRole() == UserRole.SUPERVISOR)
                .map(UserAccount::getUserId).toList();
        Map<Long, StudentProfile> studentProfiles = studentIds.isEmpty()
                ? Map.of()
                : studentProfileRepository.findAllById(studentIds).stream()
                        .collect(Collectors.toMap(StudentProfile::getUserId, sp -> sp));
        Map<Long, SupervisorProfile> supervisorProfiles = supervisorIds.isEmpty()
                ? Map.of()
                : supervisorProfileRepository.findAllById(supervisorIds).stream()
                        .collect(Collectors.toMap(SupervisorProfile::getUserId, sp -> sp));

        List<Map<String, Object>> users = page.getContent().stream()
                .map(u -> buildAdminUserListItem(u, studentProfiles, supervisorProfiles))
                .collect(Collectors.toList());

        return Map.of("users", users, "total", page.getTotalElements());
    }

    public Map<String, Object> buildAdminUserListItem(UserAccount user) {
        return buildAdminUserListItem(user, Map.of(), Map.of());
    }

    public Map<String, Object> buildAdminUserListItem(
            UserAccount user,
            Map<Long, StudentProfile> studentProfileCache,
            Map<Long, SupervisorProfile> supervisorProfileCache) {
        String department = "";
        if (user.getRole() == UserRole.STUDENT) {
            StudentProfile sp = studentProfileCache.get(user.getUserId());
            if (sp == null) sp = studentProfileRepository.findById(user.getUserId()).orElse(null);
            department = sp != null && sp.getFaculty() != null ? sp.getFaculty() : "";
        } else if (user.getRole() == UserRole.SUPERVISOR) {
            SupervisorProfile svp = supervisorProfileCache.get(user.getUserId());
            if (svp == null) svp = supervisorProfileRepository.findById(user.getUserId()).orElse(null);
            department = svp != null && svp.getFaculty() != null ? svp.getFaculty() : "";
        }

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("userId", user.getUserId().toString());
        dto.put("email", user.getEmail());
        dto.put("fullName", user.getFullName());
        dto.put("role", user.getRole().name());
        dto.put("status", user.getStatus().name());
        dto.put("department", department);
        dto.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        dto.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
        dto.put("isLocked", user.getStatus() == UserStatus.BLOCKED);
        return dto;
    }

    public Map<String, Object> getUserDetail(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Map<String, Object> dto = buildAdminUserListItem(user);
        dto.put("phone", user.getPhone());
        dto.put("loginAttempts", 0);
        dto.put("passwordChangedAt", null);
        dto.put("createdBy", "System");
        dto.put("updatedAt", user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : "");
        dto.put("notes", "");
        dto.put("sessions", List.of());
        dto.put("activityLog", List.of());
        return dto;
    }

    // ========== Parameters ==========

    public Map<String, Object> getParameters(String category) {
        List<SystemParameter> params;
        if (category != null && !category.isBlank()) {
            params = systemParameterRepository.findByCategoryOrderByParamKeyAsc(category);
        } else {
            params = systemParameterRepository.findAll();
        }
        List<Map<String, Object>> dtos = params.stream()
                .map(this::buildParameterDto)
                .collect(Collectors.toList());
        return Map.of("parameters", dtos, "total", dtos.size());
    }

    public Map<String, Object> buildParameterDto(SystemParameter param) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("parameterId", param.getParamId());
        dto.put("key", param.getParamKey());
        dto.put("value", param.getParamValue());
        dto.put("type", param.getParamType() != null ? param.getParamType() : "STRING");
        dto.put("category", param.getCategory() != null ? param.getCategory() : "GENERAL");
        dto.put("label", param.getLabel() != null ? param.getLabel() : param.getParamKey());
        dto.put("description", param.getDescription());
        dto.put("defaultValue", param.getDefaultValue());
        dto.put("isEditable", param.getIsEditable());
        dto.put("validationRules", param.getValidationRules());
        dto.put("lastModifiedAt", param.getUpdatedAt() != null ? param.getUpdatedAt().toString() : null);
        return dto;
    }

    // ========== Cycles ==========

    public Map<String, Object> getCycles(String status, String type) {
        List<FypCycle> cycles = fypCycleRepository.findAllByOrderByStartDateDesc();
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            CycleStatus filterStatus;
            try {
                filterStatus = CycleStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                filterStatus = null;
            }
            if (filterStatus != null) {
                CycleStatus finalStatus = filterStatus;
                cycles = cycles.stream().filter(c -> c.getStatus() == finalStatus).collect(Collectors.toList());
            }
        }
        if (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type)) {
            String typeUpper = type.toUpperCase();
            cycles = cycles.stream()
                    .filter(c -> typeUpper.equalsIgnoreCase(c.getCycleType()))
                    .collect(Collectors.toList());
        }
        List<Map<String, Object>> dtos = cycles.stream()
                .map(this::buildCycleDto)
                .collect(Collectors.toList());
        return Map.of("cycles", dtos, "total", dtos.size());
    }

    public Map<String, Object> getCycleDetail(Long cycleId) {
        FypCycle cycle = fypCycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));
        return buildCycleDto(cycle);
    }

    public Map<String, Object> buildCycleDto(FypCycle cycle) {
        String name = (cycle.getCycleType() != null ? cycle.getCycleType() : "FYP")
                + " " + (cycle.getAcademicYear() != null ? cycle.getAcademicYear() : "")
                + (cycle.getSemester() != null ? " Sem " + cycle.getSemester() : "");

        long totalStudents = 0;
        long pairedStudents = 0;
        long completedProjects = 0;
        try {
            Page<Project> projects = projectRepository.findAllByCycleId(cycle.getCycleId(), Pageable.unpaged());
            totalStudents = projects.getTotalElements();
            pairedStudents = projects.getContent().stream()
                    .filter(p -> p.getSupervisor() != null).count();
            completedProjects = projects.getContent().stream()
                    .filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count();
        } catch (Exception ignored) {}

        long deadlineCount = 0;
        try {
            deadlineCount = deadlineRepository.findByCycle_CycleIdOrderByDueDateAsc(cycle.getCycleId()).size();
        } catch (Exception ignored) {}

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("cycleId", cycle.getCycleId());
        dto.put("cycleCode", cycle.getCycleCode());
        dto.put("name", name.trim());
        dto.put("type", cycle.getCycleType() != null ? cycle.getCycleType() : "FYP1");
        dto.put("academicYear", cycle.getAcademicYear());
        dto.put("semester", cycle.getSemester());
        dto.put("startDate", cycle.getStartDate() != null ? cycle.getStartDate().toString() : "");
        dto.put("endDate", cycle.getEndDate() != null ? cycle.getEndDate().toString() : "");
        dto.put("status", cycle.getStatus().name());
        dto.put("isActive", cycle.getStatus() == CycleStatus.ACTIVE);
        dto.put("totalStudents", totalStudents);
        dto.put("pairedStudents", pairedStudents);
        dto.put("completedProjects", completedProjects);
        dto.put("deadlineCount", deadlineCount);
        dto.put("createdAt", cycle.getCreatedAt() != null ? cycle.getCreatedAt().toString() : "");
        dto.put("updatedAt", cycle.getUpdatedAt() != null ? cycle.getUpdatedAt().toString() : "");
        return dto;
    }

    // ========== Deadlines ==========

    public Map<String, Object> getDeadlines(Long cycleId) {
        List<Deadline> deadlines;
        if (cycleId != null) {
            deadlines = deadlineRepository.findByCycle_CycleIdOrderByDueDateAsc(cycleId);
        } else {
            deadlines = deadlineRepository.findAll();
        }
        List<Map<String, Object>> dtos = deadlines.stream()
                .map(this::buildDeadlineDto)
                .collect(Collectors.toList());
        return Map.of("deadlines", dtos, "total", dtos.size());
    }

    public Map<String, Object> getDeadlineDetail(Long deadlineId) {
        Deadline d = deadlineRepository.findById(deadlineId)
                .orElseThrow(() -> new ResourceNotFoundException("Deadline not found"));
        return buildDeadlineDto(d);
    }

    public Map<String, Object> buildDeadlineDto(Deadline d) {
        String cycleName = "";
        Long cycleId = null;
        if (d.getCycle() != null) {
            FypCycle cycle = d.getCycle();
            cycleId = cycle.getCycleId();
            cycleName = (cycle.getCycleType() != null ? cycle.getCycleType() : "FYP")
                    + " " + (cycle.getAcademicYear() != null ? cycle.getAcademicYear() : "")
                    + (cycle.getSemester() != null ? " Sem " + cycle.getSemester() : "");
        }

        // Determine status based on due date
        String status = "UPCOMING";
        if (d.getDueDate() != null) {
            LocalDate now = LocalDate.now();
            if (d.getDueDate().isBefore(now)) {
                status = "PAST";
            } else if (d.getDueDate().isEqual(now) || d.getDueDate().isBefore(now.plusDays(7))) {
                status = "ACTIVE";
            }
        }

        // Parse reminder days from JSON string
        List<Integer> reminderDays = List.of();
        if (d.getReminderDays() != null && !d.getReminderDays().isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                List<Integer> parsed = objectMapper.readValue(d.getReminderDays(), List.class);
                reminderDays = parsed;
            } catch (Exception ignored) {}
        }

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("deadlineId", d.getDeadlineId());
        dto.put("cycleId", cycleId);
        dto.put("cycleName", cycleName.trim());
        dto.put("title", d.getTitle());
        dto.put("type", d.getDeadlineType() != null ? d.getDeadlineType() : "CUSTOM");
        dto.put("description", d.getDescription());
        dto.put("dueDate", d.getDueDate() != null ? d.getDueDate().toString() : "");
        dto.put("reminderDays", reminderDays);
        dto.put("status", status);
        dto.put("targetRoles", d.getAudience() != null ? List.of(d.getAudience()) : List.of("STUDENT"));
        dto.put("isExtendable", d.getIsExtendable());
        dto.put("createdAt", d.getCreatedAt() != null ? d.getCreatedAt().toString() : "");
        dto.put("updatedAt", d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : "");
        return dto;
    }

    // ========== Integrations ==========

    public Map<String, Object> getIntegrations() {
        List<IntegrationSetting> settings = integrationSettingRepository.findAll();
        List<Map<String, Object>> dtos = settings.stream()
                .map(this::buildIntegrationDto)
                .collect(Collectors.toList());
        return Map.of("integrations", dtos, "total", dtos.size());
    }

    public Map<String, Object> getIntegrationDetail(Long integrationId) {
        IntegrationSetting s = integrationSettingRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));
        return buildIntegrationDto(s);
    }

    public Map<String, Object> buildIntegrationDto(IntegrationSetting s) {
        // Parse settings JSON
        Map<String, Object> settings = Map.of();
        if (s.getSettingsJson() != null && !s.getSettingsJson().isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> parsed = objectMapper.readValue(s.getSettingsJson(), Map.class);
                settings = parsed;
            } catch (Exception ignored) {}
        }

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("integrationId", s.getIntegrationId());
        dto.put("name", s.getName());
        dto.put("type", s.getIntegrationType() != null ? s.getIntegrationType() : "OTHER");
        dto.put("status", s.getStatus() != null ? s.getStatus() : "INACTIVE");
        dto.put("provider", s.getProvider());
        dto.put("description", s.getDescription());
        dto.put("configuredAt", s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null);
        dto.put("lastTestedAt", s.getLastTestedAt() != null ? s.getLastTestedAt().toString() : null);
        dto.put("lastTestResult", s.getLastTestResult());
        dto.put("settings", settings);
        return dto;
    }

    // ========== Audit Logs ==========

    public Map<String, Object> getAuditLogs(String action, String entityType, Long performedBy,
                                             LocalDateTime dateFrom, LocalDateTime dateTo, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findWithFilters(action, entityType, performedBy, dateFrom, dateTo, pageable);
        List<Map<String, Object>> dtos = page.getContent().stream()
                .map(this::buildAuditLogDto)
                .collect(Collectors.toList());
        return Map.of("logs", dtos, "total", page.getTotalElements());
    }

    public Map<String, Object> buildAuditLogDto(AuditLog log) {
        // Need to fetch user info since it's @JsonIgnored
        String performedBy = "";
        String performedByName = "";
        String performedByRole = "";
        if (log.getUser() != null) {
            UserAccount user = log.getUser();
            performedBy = user.getUserId().toString();
            performedByName = user.getFullName();
            performedByRole = user.getRole().name();
        }

        // The audit_log table only stores `entity_name`, but every caller
        // currently passes a type label (e.g. "USER_ACCOUNT", "FYP_GRADE") in
        // that slot. Echo it as `entityType` and leave `entityName` null so
        // the audit-log UI doesn't render the redundant quoted "USER_ACCOUNT".
        // If a caller later supplies a real label distinct from the type,
        // surface it as the name.
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("auditId", log.getAuditId());
        dto.put("action", log.getAction());
        dto.put("entityType", log.getEntityName());
        dto.put("entityId", log.getEntityId());
        dto.put("entityName", null);
        dto.put("performedBy", performedBy);
        dto.put("performedByName", performedByName);
        dto.put("performedByRole", performedByRole);
        dto.put("timestamp", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "");
        dto.put("ipAddress", log.getIpAddress());
        dto.put("oldValue", log.getOldValue());
        dto.put("newValue", log.getNewValue());
        dto.put("details", log.getDetails());
        dto.put("userAgent", log.getUserAgent());
        return dto;
    }

    // ========== Health Checks ==========

    public Map<String, Object> getHealthChecks() {
        List<Map<String, Object>> checks = new ArrayList<>();

        // Database — real SELECT 1 with elapsed-time measurement
        Map<String, Object> dbCheck = new LinkedHashMap<>();
        dbCheck.put("checkId", "db");
        dbCheck.put("name", "Database Connection");
        dbCheck.put("lastCheckedAt", LocalDateTime.now().toString());
        long dbStart = System.nanoTime();
        try {
            Object result = entityManager.createNativeQuery("SELECT 1").getSingleResult();
            long ms = Math.max(1, (System.nanoTime() - dbStart) / 1_000_000);
            dbCheck.put("status", "1".equals(String.valueOf(result)) ? "HEALTHY" : "DEGRADED");
            dbCheck.put("responseTime", (int) ms);
            dbCheck.put("message", "Database reachable (" + ms + "ms)");
        } catch (Exception e) {
            dbCheck.put("status", "UNHEALTHY");
            dbCheck.put("responseTime", 0);
            dbCheck.put("message", "Database probe failed: " + e.getMessage());
        }
        checks.add(dbCheck);

        // File Storage — real existence + writability probe on upload root
        Map<String, Object> storageCheck = new LinkedHashMap<>();
        storageCheck.put("checkId", "storage");
        storageCheck.put("name", "File Storage");
        storageCheck.put("lastCheckedAt", LocalDateTime.now().toString());
        long storageStart = System.nanoTime();
        try {
            Path uploadPath = fileStorageConfig.getUploadPath();
            boolean exists = Files.exists(uploadPath);
            boolean writable = exists && Files.isWritable(uploadPath);
            long ms = Math.max(1, (System.nanoTime() - storageStart) / 1_000_000);
            if (!exists) {
                storageCheck.put("status", "UNHEALTHY");
                storageCheck.put("message", "Upload directory missing: " + uploadPath);
            } else if (!writable) {
                storageCheck.put("status", "DEGRADED");
                storageCheck.put("message", "Upload directory not writable: " + uploadPath);
            } else {
                storageCheck.put("status", "HEALTHY");
                storageCheck.put("message", "Upload directory writable (" + ms + "ms)");
            }
            storageCheck.put("responseTime", (int) ms);
        } catch (Exception e) {
            storageCheck.put("status", "UNHEALTHY");
            storageCheck.put("responseTime", 0);
            storageCheck.put("message", "Storage probe failed: " + e.getMessage());
        }
        checks.add(storageCheck);

        // AI Recommendation Service
        Map<String, Object> aiRecCheck = new LinkedHashMap<>();
        aiRecCheck.put("checkId", "ai-recommendation");
        aiRecCheck.put("name", "AI Recommendation Service");
        boolean recHealthy = aiServiceClient.isRecommendationServiceHealthy();
        aiRecCheck.put("status", recHealthy ? "HEALTHY" : "UNHEALTHY");
        aiRecCheck.put("lastCheckedAt", LocalDateTime.now().toString());
        aiRecCheck.put("responseTime", recHealthy ? 200 : 0);
        aiRecCheck.put("message", recHealthy ? "Service responding" : "Service unavailable");
        checks.add(aiRecCheck);

        // AI Analyzer Service
        Map<String, Object> aiAnalyzerCheck = new LinkedHashMap<>();
        aiAnalyzerCheck.put("checkId", "ai-analyzer");
        aiAnalyzerCheck.put("name", "AI Proposal Analyzer");
        boolean analyzerHealthy = aiServiceClient.isAnalyzerServiceHealthy();
        aiAnalyzerCheck.put("status", analyzerHealthy ? "HEALTHY" : "UNHEALTHY");
        aiAnalyzerCheck.put("lastCheckedAt", LocalDateTime.now().toString());
        aiAnalyzerCheck.put("responseTime", analyzerHealthy ? 200 : 0);
        aiAnalyzerCheck.put("message", analyzerHealthy ? "Service responding" : "Service unavailable");
        checks.add(aiAnalyzerCheck);

        // AI Chatbot Service
        Map<String, Object> aiChatCheck = new LinkedHashMap<>();
        aiChatCheck.put("checkId", "ai-chatbot");
        aiChatCheck.put("name", "AI Chatbot Service");
        boolean chatHealthy = aiServiceClient.isChatbotServiceHealthy();
        aiChatCheck.put("status", chatHealthy ? "HEALTHY" : "UNHEALTHY");
        aiChatCheck.put("lastCheckedAt", LocalDateTime.now().toString());
        aiChatCheck.put("responseTime", chatHealthy ? 200 : 0);
        aiChatCheck.put("message", chatHealthy ? "Service responding" : "Service unavailable");
        checks.add(aiChatCheck);

        return Map.of("checks", checks);
    }
}
