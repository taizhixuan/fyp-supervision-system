package com.fyp.supervision.service;

import com.fyp.supervision.entity.ApprovedStudentRoster;
import com.fyp.supervision.entity.ApprovedSupervisorRoster;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.repository.ApprovedStudentRosterRepository;
import com.fyp.supervision.repository.ApprovedSupervisorRosterRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminRosterService {

    private static final Pattern STUDENT_DOMAIN = Pattern.compile("^[A-Za-z0-9._%+-]+@student\\.mmu\\.edu\\.my$");
    private static final Pattern STAFF_DOMAIN = Pattern.compile("^[A-Za-z0-9._%+-]+@mmu\\.edu\\.my$");
    private static final Pattern MMU_ID = Pattern.compile("^\\d{10}$");

    private final ApprovedStudentRosterRepository studentRosterRepository;
    private final ApprovedSupervisorRosterRepository supervisorRosterRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;

    public List<Map<String, Object>> listStudents() {
        return studentRosterRepository.findAllByOrderByUploadedAtDesc().stream()
                .map(AdminRosterService::studentDto)
                .toList();
    }

    public List<Map<String, Object>> listSupervisors() {
        return supervisorRosterRepository.findAllByOrderByUploadedAtDesc().stream()
                .map(AdminRosterService::supervisorDto)
                .toList();
    }

    @Transactional
    public Map<String, Object> importStudents(MultipartFile file, Long uploadedByUserId) {
        UserAccount uploadedBy = uploadedByUserId == null ? null
                : userAccountRepository.findById(uploadedByUserId).orElse(null);

        ImportSummary summary = new ImportSummary();
        readCsv(file, (lineNo, columns) -> {
            String mmuId = column(columns, 0);
            String email = column(columns, 1).toLowerCase();
            if (mmuId.isEmpty() || email.isEmpty()) {
                summary.errors.add("Line " + lineNo + ": missing mmuId or email");
                return;
            }
            if (!MMU_ID.matcher(mmuId).matches()) {
                summary.errors.add("Line " + lineNo + ": mmuId must be 10 digits (" + mmuId + ")");
                return;
            }
            if (!STUDENT_DOMAIN.matcher(email).matches()) {
                summary.errors.add("Line " + lineNo + ": email must end with @student.mmu.edu.my (" + email + ")");
                return;
            }

            String fullName = column(columns, 2);
            String programme = column(columns, 3);
            String faculty = column(columns, 4);
            Integer intakeYear = parseInt(column(columns, 5));

            ApprovedStudentRoster row = studentRosterRepository.findByMmuId(mmuId)
                    .orElseGet(ApprovedStudentRoster::new);
            boolean isNew = row.getRosterId() == null;
            row.setMmuId(mmuId);
            row.setEmail(email);
            if (!fullName.isEmpty()) row.setFullName(fullName);
            if (!programme.isEmpty()) row.setProgramme(programme);
            if (!faculty.isEmpty()) row.setFaculty(faculty);
            if (intakeYear != null) row.setIntakeYear(intakeYear);
            if (isNew) row.setUploadedBy(uploadedBy);
            studentRosterRepository.save(row);
            if (isNew) summary.imported++; else summary.updated++;

            // Retroactive approval — pending student with matching mmuId+email gets activated.
            userAccountRepository.findByMmuId(mmuId).ifPresent(user -> {
                if (user.getRole() == UserRole.STUDENT
                        && user.getStatus() == UserStatus.PENDING
                        && email.equalsIgnoreCase(user.getEmail())) {
                    user.setStatus(UserStatus.ACTIVE);
                    userAccountRepository.save(user);
                    summary.autoApproved++;
                    notificationService.createNotification(
                            user.getUserId(),
                            "ACCOUNT_APPROVED",
                            "Account approved",
                            "Your student account has been approved. You can now sign in.",
                            "/login"
                    );
                }
            });
        });
        return summary.toMap();
    }

    @Transactional
    public Map<String, Object> importSupervisors(MultipartFile file, Long uploadedByUserId) {
        UserAccount uploadedBy = uploadedByUserId == null ? null
                : userAccountRepository.findById(uploadedByUserId).orElse(null);

        ImportSummary summary = new ImportSummary();
        readCsv(file, (lineNo, columns) -> {
            String mmuId = column(columns, 0);
            String email = column(columns, 1).toLowerCase();
            if (mmuId.isEmpty() || email.isEmpty()) {
                summary.errors.add("Line " + lineNo + ": missing mmuId or email");
                return;
            }
            if (!MMU_ID.matcher(mmuId).matches()) {
                summary.errors.add("Line " + lineNo + ": mmuId must be 10 digits (" + mmuId + ")");
                return;
            }
            if (!STAFF_DOMAIN.matcher(email).matches()) {
                summary.errors.add("Line " + lineNo + ": email must end with @mmu.edu.my (" + email + ")");
                return;
            }

            String fullName = column(columns, 2);
            String department = column(columns, 3);
            String faculty = column(columns, 4);
            String position = column(columns, 5);

            ApprovedSupervisorRoster row = supervisorRosterRepository.findByMmuId(mmuId)
                    .orElseGet(ApprovedSupervisorRoster::new);
            boolean isNew = row.getRosterId() == null;
            row.setMmuId(mmuId);
            row.setEmail(email);
            if (!fullName.isEmpty()) row.setFullName(fullName);
            if (!department.isEmpty()) row.setDepartment(department);
            if (!faculty.isEmpty()) row.setFaculty(faculty);
            if (!position.isEmpty()) row.setPosition(position);
            if (isNew) row.setUploadedBy(uploadedBy);
            supervisorRosterRepository.save(row);
            if (isNew) summary.imported++; else summary.updated++;

            userAccountRepository.findByMmuId(mmuId).ifPresent(user -> {
                if (user.getRole() == UserRole.SUPERVISOR
                        && user.getStatus() == UserStatus.PENDING
                        && email.equalsIgnoreCase(user.getEmail())) {
                    user.setStatus(UserStatus.ACTIVE);
                    userAccountRepository.save(user);
                    summary.autoApproved++;
                    notificationService.createNotification(
                            user.getUserId(),
                            "ACCOUNT_APPROVED",
                            "Account approved",
                            "Your supervisor account has been approved. You can now sign in.",
                            "/login"
                    );
                }
            });
        });
        return summary.toMap();
    }

    @Transactional
    public void deleteStudent(Long rosterId) {
        if (!studentRosterRepository.existsById(rosterId)) {
            throw new BadRequestException("Roster entry not found.");
        }
        studentRosterRepository.deleteById(rosterId);
    }

    @Transactional
    public void deleteSupervisor(Long rosterId) {
        if (!supervisorRosterRepository.existsById(rosterId)) {
            throw new BadRequestException("Roster entry not found.");
        }
        supervisorRosterRepository.deleteById(rosterId);
    }

    private interface RowHandler {
        void accept(int lineNo, String[] columns);
    }

    private static void readCsv(MultipartFile file, RowHandler handler) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is empty.");
        }
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNo = 0;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                lineNo++;
                if (line.isBlank()) continue;
                if (firstLine) {
                    firstLine = false;
                    String lower = line.toLowerCase();
                    if (lower.contains("mmuid") || lower.contains("mmu_id") || lower.contains("studentid")) {
                        continue; // header row
                    }
                }
                handler.accept(lineNo, line.split(","));
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to read CSV: " + e.getMessage());
        }
    }

    private static String column(String[] cols, int idx) {
        if (cols == null || idx >= cols.length || cols[idx] == null) return "";
        return cols[idx].trim().replaceAll("^\"|\"$", "");
    }

    private static Integer parseInt(String value) {
        if (value == null || value.isEmpty()) return null;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Map<String, Object> studentDto(ApprovedStudentRoster r) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("rosterId", r.getRosterId());
        dto.put("mmuId", r.getMmuId());
        dto.put("email", r.getEmail());
        dto.put("fullName", r.getFullName());
        dto.put("programme", r.getProgramme());
        dto.put("faculty", r.getFaculty());
        dto.put("intakeYear", r.getIntakeYear());
        dto.put("uploadedAt", r.getUploadedAt() != null ? r.getUploadedAt().toString() : null);
        return dto;
    }

    private static Map<String, Object> supervisorDto(ApprovedSupervisorRoster r) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("rosterId", r.getRosterId());
        dto.put("mmuId", r.getMmuId());
        dto.put("email", r.getEmail());
        dto.put("fullName", r.getFullName());
        dto.put("department", r.getDepartment());
        dto.put("faculty", r.getFaculty());
        dto.put("position", r.getPosition());
        dto.put("uploadedAt", r.getUploadedAt() != null ? r.getUploadedAt().toString() : null);
        return dto;
    }

    private static final class ImportSummary {
        int imported = 0;
        int updated = 0;
        int autoApproved = 0;
        final List<String> errors = new ArrayList<>();

        Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("imported", imported);
            m.put("updated", updated);
            m.put("autoApproved", autoApproved);
            m.put("errors", errors);
            m.put("errorCount", errors.size());
            return m;
        }
    }
}
