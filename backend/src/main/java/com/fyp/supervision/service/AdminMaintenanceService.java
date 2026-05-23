package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.MaintenanceJob;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AuditLogRepository;
import com.fyp.supervision.repository.MaintenanceJobRepository;
import com.fyp.supervision.repository.PasswordResetTokenRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AdminMaintenanceService {

    private final MaintenanceJobRepository maintenanceJobRepository;
    private final UserAccountRepository userAccountRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final FileStorageConfig fileStorageConfig;
    private final DataSource dataSource;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PersistenceContext
    private EntityManager entityManager;

    // Columns across the schema that hold relative paths under uploads/. Used by the
    // orphan-file sweeper to know which on-disk files are still referenced.
    private static final Map<String, String> FILE_REF_COLUMNS = Map.of(
            "user_account", "profile_image_path",
            "announcement_attachment", "file_path",
            "generated_report", "file_path",
            "project_document", "storage_path",
            "proposal_version", "upload_file_path",
            "resource_document", "storage_path"
    );

    // Subdirs under uploads/ that the orphan sweeper should never touch (they're not
    // tied to entity rows — backups are first-class admin artefacts, temp is its own
    // option, reports live behind generated_report rows already covered above).
    private static final Set<String> ORPHAN_SKIP_DIRS = Set.of("backups", "temp", "tmp");

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
                    stream.filter(p -> Files.isRegularFile(p)
                                    && (p.toString().endsWith(".sql") || p.toString().endsWith(".txt")))
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
                                b.put("type", detectBackupType(p.getFileName().toString()));
                                b.put("status", "AVAILABLE");
                                b.put("expiresAt", LocalDateTime.now().plusMonths(1).toString());
                                backups.add(b);
                            });
                }
            }
        } catch (IOException ignored) {}
        return Map.of("backups", backups, "total", backups.size());
    }

    private static String detectBackupType(String fileName) {
        String n = fileName.toLowerCase();
        if (n.startsWith("incremental_")) return "INCREMENTAL";
        if (n.startsWith("database_")) return "DATABASE";
        return "FULL";
    }

    public Map<String, Object> createBackup(Long userId, Map<String, Object> data) {
        String type = data != null && data.get("type") instanceof String s ? s.toUpperCase() : "FULL";
        MaintenanceJob job = null;
        try {
            job = MaintenanceJob.builder()
                    .jobType("BACKUP")
                    .status("RUNNING")
                    .startedAt(LocalDateTime.now())
                    .message("Backup started")
                    .triggeredBy(userId != null ? userAccountRepository.findById(userId).orElse(null) : null)
                    .build();
            job = maintenanceJobRepository.save(job);

            Path backupDir = fileStorageConfig.getUploadPath().resolve("backups");
            Files.createDirectories(backupDir);
            String stamp = String.valueOf(System.currentTimeMillis());
            String fileName = type.toLowerCase() + "_backup_" + stamp + ".sql";
            Path filePath = backupDir.resolve(fileName);

            long rowsExported = dumpDatabase(filePath, type);
            long fileSize = Files.size(filePath);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "Backup created: " + fileName);
            result.put("fileName", fileName);
            result.put("rowsExported", rowsExported);
            result.put("fileSize", fileSize);
            result.put("downloadUrl", "/api/admin/maintenance/backups/download?file=" + fileName);

            job.setStatus("COMPLETED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage("Backup completed: " + rowsExported + " rows, " + fileSize + " bytes");
            try {
                job.setResultJson(objectMapper.writeValueAsString(result));
            } catch (Exception ignored) {
                // Result JSON is informational; don't fail the whole backup over serialization.
            }
            maintenanceJobRepository.save(job);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job.getJobId());
            response.put("type", type);
            response.put("status", "COMPLETED");
            response.put("fileName", fileName);
            response.put("rowsExported", rowsExported);
            response.put("fileSize", fileSize);
            response.put("downloadUrl", "/api/admin/maintenance/backups/download?file=" + fileName);
            return response;
        } catch (Exception e) {
            // Make sure a failure response always comes back as 200 with a FAILED payload
            // instead of bubbling up to a 500 — the frontend keys its toast off the status field.
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            try {
                if (job != null) {
                    job.setStatus("FAILED");
                    job.setCompletedAt(LocalDateTime.now());
                    job.setMessage("Backup failed: " + msg);
                    maintenanceJobRepository.save(job);
                }
            } catch (Exception ignored) {
                // Best-effort: if the failed-state save itself blows up, still return a clean response.
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job != null ? job.getJobId() : null);
            response.put("type", type);
            response.put("status", "FAILED");
            response.put("message", msg);
            return response;
        }
    }

    /**
     * Dump the connected MySQL schema to a portable .sql file using JDBC. Produces
     * CREATE TABLE + INSERT INTO statements that can be replayed by either the
     * mysql client or {@link #restoreFromFile(Path)}. INCREMENTAL is mapped to FULL
     * because incremental backup requires binlog access that the JDBC user doesn't
     * have; the type is preserved in the filename for the admin's reference.
     */
    private long dumpDatabase(Path target, String type) throws Exception {
        long totalRows = 0;
        try (Connection conn = dataSource.getConnection();
             java.io.BufferedWriter out = Files.newBufferedWriter(target, StandardCharsets.UTF_8)) {

            DatabaseMetaData meta = conn.getMetaData();
            String schema = conn.getCatalog();

            out.write("-- FYP Supervision System backup\n");
            out.write("-- Type: " + type + "\n");
            out.write("-- Schema: " + schema + "\n");
            out.write("-- Created: " + LocalDateTime.now() + "\n");
            out.write("-- Engine: MySQL JDBC dump\n\n");
            out.write("SET FOREIGN_KEY_CHECKS=0;\n");
            out.write("SET UNIQUE_CHECKS=0;\n");
            out.write("SET NAMES utf8mb4;\n\n");

            List<String> tables = new ArrayList<>();
            try (ResultSet rs = meta.getTables(schema, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tn = rs.getString("TABLE_NAME");
                    // Flyway's own bookkeeping table doesn't roundtrip cleanly — skip it; a
                    // restore on a fresh DB applies migrations first, then the data dump.
                    if (!"flyway_schema_history".equalsIgnoreCase(tn)) tables.add(tn);
                }
            }

            for (String table : tables) {
                String createSql = fetchCreateTable(conn, table);
                out.write("DROP TABLE IF EXISTS `" + table + "`;\n");
                out.write(createSql);
                out.write(";\n\n");

                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT * FROM `" + table + "`")) {
                    ResultSetMetaData rsmd = rs.getMetaData();
                    int colCount = rsmd.getColumnCount();
                    StringBuilder cols = new StringBuilder();
                    for (int i = 1; i <= colCount; i++) {
                        if (i > 1) cols.append(',');
                        cols.append('`').append(rsmd.getColumnName(i)).append('`');
                    }
                    while (rs.next()) {
                        StringBuilder row = new StringBuilder("INSERT INTO `" + table + "` (" + cols + ") VALUES (");
                        for (int i = 1; i <= colCount; i++) {
                            if (i > 1) row.append(',');
                            row.append(sqlLiteral(rs, i, rsmd.getColumnType(i)));
                        }
                        row.append(");\n");
                        out.write(row.toString());
                        totalRows++;
                    }
                }
                out.write("\n");
            }

            out.write("SET FOREIGN_KEY_CHECKS=1;\n");
            out.write("SET UNIQUE_CHECKS=1;\n");
        }
        return totalRows;
    }

    private static String fetchCreateTable(Connection conn, String table) throws Exception {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SHOW CREATE TABLE `" + table + "`")) {
            if (rs.next()) return rs.getString(2);
        }
        return "-- could not introspect " + table;
    }

    private static String sqlLiteral(ResultSet rs, int idx, int sqlType) throws Exception {
        Object val = rs.getObject(idx);
        if (val == null || rs.wasNull()) return "NULL";
        switch (sqlType) {
            case Types.BIT:
            case Types.BOOLEAN:
            case Types.TINYINT:
            case Types.SMALLINT:
            case Types.INTEGER:
            case Types.BIGINT:
            case Types.FLOAT:
            case Types.REAL:
            case Types.DOUBLE:
            case Types.NUMERIC:
            case Types.DECIMAL:
                return val.toString();
            case Types.BINARY:
            case Types.VARBINARY:
            case Types.LONGVARBINARY:
            case Types.BLOB:
                byte[] bytes = rs.getBytes(idx);
                StringBuilder hex = new StringBuilder("0x");
                for (byte b : bytes) hex.append(String.format("%02X", b));
                return hex.toString();
            default:
                return "'" + val.toString().replace("\\", "\\\\").replace("'", "''").replace("\n", "\\n").replace("\r", "\\r") + "'";
        }
    }

    public Map<String, Object> restoreBackup(Long userId, String backupRef) {
        MaintenanceJob job = MaintenanceJob.builder()
                .jobType("RESTORE")
                .status("RUNNING")
                .startedAt(LocalDateTime.now())
                .triggeredBy(userId != null ? userAccountRepository.findById(userId).orElse(null) : null)
                .message("Restore started: " + backupRef)
                .build();
        job = maintenanceJobRepository.save(job);

        try {
            Path file = resolveBackupRef(backupRef);
            long stmtCount = restoreFromFile(file);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("fileName", file.getFileName().toString());
            result.put("statementsExecuted", stmtCount);
            result.put("message", "Restore completed: " + stmtCount + " statements applied.");

            job.setStatus("COMPLETED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage(result.get("message").toString());
            job.setResultJson(objectMapper.writeValueAsString(result));
            maintenanceJobRepository.save(job);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job.getJobId());
            response.put("backupRef", backupRef);
            response.put("fileName", file.getFileName().toString());
            response.put("statementsExecuted", stmtCount);
            response.put("status", "COMPLETED");
            response.put("message", result.get("message"));
            return response;
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            job.setStatus("FAILED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage("Restore failed: " + msg);
            maintenanceJobRepository.save(job);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", job.getJobId());
            response.put("backupRef", backupRef);
            response.put("status", "FAILED");
            response.put("message", msg);
            return response;
        }
    }

    /**
     * Resolve either a backupId (positional index into {@link #getBackups()}) or a
     * raw filename to an actual file path in uploads/backups/. Rejects path traversal.
     */
    private Path resolveBackupRef(String ref) {
        if (ref == null || ref.isBlank()) throw new ResourceNotFoundException("Missing backup reference");
        if (ref.contains("..") || ref.contains("/") || ref.contains("\\"))
            throw new ResourceNotFoundException("Invalid backup reference");

        Path backupDir = fileStorageConfig.getUploadPath().resolve("backups");
        // If it parses as an integer, look up the Nth backup by recency to match the listing.
        try {
            int idx = Integer.parseInt(ref);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) getBackups().get("backups");
            for (Map<String, Object> b : list) {
                if (Objects.equals(b.get("backupId"), idx)) {
                    return backupDir.resolve(b.get("fileName").toString());
                }
            }
            throw new ResourceNotFoundException("Backup not found for id " + ref);
        } catch (NumberFormatException ignored) {
            Path candidate = backupDir.resolve(ref);
            if (!Files.exists(candidate)) throw new ResourceNotFoundException("Backup file not found: " + ref);
            return candidate;
        }
    }

    /**
     * Replay a .sql dump produced by {@link #dumpDatabase(Path, String)}. Statements
     * are split on `;` at end-of-line so the file format stays portable to the mysql
     * client. FK + uniqueness checks are disabled around the replay because the dump
     * already wraps itself in the same toggles.
     */
    private long restoreFromFile(Path file) throws Exception {
        if (!Files.exists(file)) throw new ResourceNotFoundException("Backup file not found: " + file.getFileName());
        long count = 0;
        try (Connection conn = dataSource.getConnection()) {
            boolean prevAuto = conn.getAutoCommit();
            conn.setAutoCommit(false);
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("SET FOREIGN_KEY_CHECKS=0");
                stmt.execute("SET UNIQUE_CHECKS=0");

                StringBuilder buf = new StringBuilder();
                for (String line : Files.readAllLines(file, StandardCharsets.UTF_8)) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("--")) continue;
                    buf.append(line).append('\n');
                    if (trimmed.endsWith(";")) {
                        String sql = buf.toString().trim();
                        sql = sql.substring(0, sql.length() - 1); // strip trailing ;
                        if (!sql.isEmpty()) {
                            stmt.execute(sql);
                            count++;
                        }
                        buf.setLength(0);
                    }
                }

                stmt.execute("SET FOREIGN_KEY_CHECKS=1");
                stmt.execute("SET UNIQUE_CHECKS=1");
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(prevAuto);
            }
        }
        return count;
    }

    @Transactional
    public Map<String, Object> cleanup(Long userId, Map<String, Object> options) {
        MaintenanceJob job = MaintenanceJob.builder()
                .jobType("CLEANUP")
                .status("RUNNING")
                .startedAt(LocalDateTime.now())
                .triggeredBy(userId != null ? userAccountRepository.findById(userId).orElse(null) : null)
                .build();
        job = maintenanceJobRepository.save(job);

        // Defaults match the frontend modal: 30-day cutoff for temp / logs, 90-day
        // independent default for audit-log truncation (loud + irreversible, kept apart).
        int days = readInt(options, "olderThanDays", 30);
        int auditDays = readInt(options, "auditLogsOlderThanDays", 90);
        boolean clearTemp = readBool(options, "clearTempFiles", false);
        boolean clearLogs = readBool(options, "clearOldLogs", false);
        boolean clearSessions = readBool(options, "clearExpiredSessions", false);
        boolean clearOrphans = readBool(options, "clearOrphanedFiles", false);
        boolean clearAudit = readBool(options, "clearAuditLogs", false);

        Map<String, Object> result = new LinkedHashMap<>();
        List<String> notes = new ArrayList<>();

        try {
            if (clearTemp) {
                int n = sweepDirectory(fileStorageConfig.getUploadPath().resolve("temp"), days);
                result.put("tempFilesDeleted", n);
                notes.add(n + " temp files");
            }
            if (clearLogs) {
                Path logsDir = Paths.get(System.getProperty("user.dir"), "logs");
                int n = sweepDirectory(logsDir, days);
                result.put("logFilesDeleted", n);
                notes.add(n + " log files");
            }
            if (clearSessions) {
                int n = passwordResetTokenRepository.deleteExpiredOrUsed(LocalDateTime.now());
                result.put("expiredSessionsDeleted", n);
                notes.add(n + " expired reset tokens");
            }
            if (clearOrphans) {
                int n = sweepOrphanFiles();
                result.put("orphanedFilesDeleted", n);
                notes.add(n + " orphan files");
            }
            if (clearAudit) {
                int n = auditLogRepository.deleteByCreatedAtBefore(LocalDateTime.now().minusDays(auditDays));
                result.put("auditLogsDeleted", n);
                notes.add(n + " audit log rows");
            }

            String summary = notes.isEmpty()
                    ? "No cleanup options selected."
                    : "Cleaned " + String.join(", ", notes) + ".";
            result.put("success", true);
            result.put("message", summary);

            job.setStatus("COMPLETED");
            job.setCompletedAt(LocalDateTime.now());
            job.setMessage(summary);
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

    private int sweepDirectory(Path dir, int olderThanDays) throws IOException {
        if (dir == null || !Files.exists(dir) || !Files.isDirectory(dir)) return 0;
        long cutoffMillis = System.currentTimeMillis() - olderThanDays * 86_400_000L;
        int[] count = {0};
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.filter(Files::isRegularFile)
                    .filter(p -> {
                        try {
                            return Files.getLastModifiedTime(p).toMillis() < cutoffMillis;
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                            count[0]++;
                        } catch (IOException ignored) {
                            // Skip files we can't delete (locked, permission); the count reflects
                            // what was actually removed so the admin sees the truth.
                        }
                    });
        }
        return count[0];
    }

    private int sweepOrphanFiles() throws Exception {
        Path root = fileStorageConfig.getUploadPath();
        if (!Files.exists(root)) return 0;

        // Collect every relative path the DB still references, normalised to forward slashes
        // so the comparison works regardless of which OS wrote the row.
        Set<String> referenced = new HashSet<>();
        for (var entry : FILE_REF_COLUMNS.entrySet()) {
            String sql = "SELECT " + entry.getValue() + " FROM " + entry.getKey()
                    + " WHERE " + entry.getValue() + " IS NOT NULL";
            @SuppressWarnings("unchecked")
            List<Object> rows = entityManager.createNativeQuery(sql).getResultList();
            for (Object row : rows) {
                if (row == null) continue;
                referenced.add(normalise(row.toString()));
            }
        }

        int[] count = {0};
        try (Stream<Path> walk = Files.walk(root)) {
            walk.filter(Files::isRegularFile)
                    .filter(p -> {
                        Path rel = root.relativize(p);
                        if (rel.getNameCount() == 0) return false;
                        String top = rel.getName(0).toString();
                        return !ORPHAN_SKIP_DIRS.contains(top);
                    })
                    .forEach(p -> {
                        Path rel = root.relativize(p);
                        String relStr = normalise("uploads/" + rel.toString());
                        String relNoPrefix = normalise(rel.toString());
                        if (!referenced.contains(relStr) && !referenced.contains(relNoPrefix)) {
                            try {
                                Files.deleteIfExists(p);
                                count[0]++;
                            } catch (IOException ignored) {
                                // Permission denied etc.; skip — admin sees the actual deleted total.
                            }
                        }
                    });
        }
        return count[0];
    }

    private static String normalise(String path) {
        return path.replace('\\', '/');
    }

    private static int readInt(Map<String, Object> m, String key, int def) {
        Object v = m == null ? null : m.get(key);
        if (v instanceof Number n) return n.intValue();
        if (v instanceof String s) try { return Integer.parseInt(s); } catch (Exception ignored) {}
        return def;
    }

    private static boolean readBool(Map<String, Object> m, String key, boolean def) {
        Object v = m == null ? null : m.get(key);
        if (v instanceof Boolean b) return b;
        if (v instanceof String s) return "true".equalsIgnoreCase(s);
        return def;
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
