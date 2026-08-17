package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AccountDeletionService;
import com.fyp.supervision.service.AdminService;
import com.fyp.supervision.service.AuditService;
import com.fyp.supervision.service.AuthService;
import com.fyp.supervision.service.CycleLifecycleService;
import com.fyp.supervision.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@Slf4j
public class AdminUserController {
    private final UserAccountRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminService adminService;
    private final NotificationService notificationService;
    private final CycleLifecycleService cycleLifecycleService;
    private final AuditService auditService;
    private final AccountDeletionService accountDeletionService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long cycleId,
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getUserList(role, status, search, cycleId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserDetail(id));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> data) {
        String email = (String) data.get("email");
        String mmuIdRaw = (String) data.get("mmuId");
        String mmuId = mmuIdRaw == null ? null : mmuIdRaw.trim().toUpperCase();
        if (userRepository.existsByEmail(email)) throw new BadRequestException("Email already exists");
        if (mmuId != null && userRepository.existsByMmuId(mmuId)) throw new BadRequestException("MMU ID already exists");

        UserAccount user = UserAccount.builder()
                .mmuId(mmuId)
                .email(email)
                .passwordHash(passwordEncoder.encode((String) data.getOrDefault("password", "Temp@123")))
                .fullName((String) data.get("fullName"))
                .phone((String) data.get("phone"))
                .role(UserRole.valueOf((String) data.get("role")))
                .status(UserStatus.ACTIVE)
                .build();
        UserAccount saved = userRepository.save(user);
        // Without this the account has no StudentProfile / SupervisorProfile and the user hits
        // "profile not found" on first login — registration creates it, this path did not.
        authService.provisionRoleProfile(
                saved,
                (String) data.get("specialisation"),
                intFromData(data.get("intakeYear")));
        return ResponseEntity.ok(Map.of("userId", saved.getUserId().toString()));
    }

    /** JSON numbers arrive as Integer, but a hand-rolled client may send a string. */
    private static Integer intFromData(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Number n) return n.intValue();
        try {
            return Integer.valueOf(raw.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        UserAccount user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (data.containsKey("fullName")) user.setFullName((String) data.get("fullName"));
        if (data.containsKey("email")) user.setEmail((String) data.get("email"));
        if (data.containsKey("phone")) user.setPhone((String) data.get("phone"));
        if (data.containsKey("status")) user.setStatus(UserStatus.valueOf((String) data.get("status")));
        if (data.containsKey("role")) user.setRole(UserRole.valueOf((String) data.get("role")));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetails admin,
                                           HttpServletRequest httpRequest) {
        UserAccount adminUser = adminFromPrincipal(admin);
        // Snapshot identity BEFORE erasure — afterwards the row is scrubbed.
        UserAccount target = userRepository.findById(id).orElse(null);
        String snapshot = target != null
                ? target.getRole() + " " + target.getEmail() + " (" + target.getMmuId() + ")"
                : "unknown user " + id;
        // Anonymise rather than hard-delete: academic records hold non-null FKs
        // to user_account, so a real delete throws a 409 conflict.
        accountDeletionService.adminErase(id, adminUser != null ? adminUser.getUserId() : null);
        auditService.record(adminUser, "USER_DELETED", "USER_ACCOUNT",
                String.valueOf(id), snapshot, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/bulk-status")
    public ResponseEntity<?> bulkStatusUpdate(@RequestBody Map<String, Object> data,
                                              @AuthenticationPrincipal UserDetails admin,
                                              HttpServletRequest httpRequest) {
        Object userIdsRaw = data.get("userIds");
        if (!(userIdsRaw instanceof List<?> rawList) || rawList.isEmpty()) {
            throw new BadRequestException("userIds is required");
        }
        Object statusRaw = data.get("status");
        if (!(statusRaw instanceof String statusStr) || statusStr.isBlank()) {
            throw new BadRequestException("status is required");
        }
        UserStatus status;
        try {
            status = UserStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + statusStr);
        }
        List<Long> ids = new java.util.ArrayList<>();
        for (Object o : rawList) {
            if (o instanceof Number n) ids.add(n.longValue());
            else if (o != null) {
                try {
                    ids.add(Long.parseLong(o.toString().trim()));
                } catch (NumberFormatException e) {
                    throw new BadRequestException("userIds must be numeric");
                }
            }
        }
        List<UserAccount> users = userRepository.findByUserIdIn(ids);
        users.forEach(u -> u.setStatus(status));
        userRepository.saveAll(users);
        UserAccount adminUser = adminFromPrincipal(admin);
        // One audit row per user — easier to filter by a single user later than parsing
        // a list out of one combined row.
        for (UserAccount u : users) {
            auditService.record(adminUser, "USER_STATUS_CHANGED", "USER_ACCOUNT",
                    String.valueOf(u.getUserId()),
                    "set status=" + status + " for " + u.getEmail(), httpRequest);
        }
        return ResponseEntity.ok(Map.of("updated", users.size()));
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRegistrations(@RequestParam(required = false) String role) {
        List<UserAccount> users = userRepository.findByStatusOrderByCreatedAtAsc(UserStatus.PENDING);
        if (role != null && !role.isBlank() && !"ALL".equals(role)) {
            UserRole filterRole = UserRole.valueOf(role);
            users = users.stream().filter(u -> u.getRole() == filterRole).collect(Collectors.toList());
        }
        List<Map<String, Object>> dtos = users.stream().map(this::buildPendingDto).collect(Collectors.toList());
        long studentCount = users.stream().filter(u -> u.getRole() == UserRole.STUDENT).count();
        long supervisorCount = users.stream().filter(u -> u.getRole() == UserRole.SUPERVISOR).count();
        return ResponseEntity.ok(Map.of(
                "registrations", dtos,
                "total", dtos.size(),
                "studentCount", studentCount,
                "supervisorCount", supervisorCount
        ));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRegistration(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails admin,
            HttpServletRequest httpRequest) {
        UserAccount user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getStatus() != UserStatus.PENDING) {
            throw new BadRequestException("User is not pending approval");
        }
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        UserAccount adminUser = adminFromPrincipal(admin);
        auditService.record(adminUser, "USER_APPROVED", "USER_ACCOUNT", String.valueOf(id),
                "approved " + user.getRole() + " " + user.getEmail(), httpRequest);
        if (user.getRole() == UserRole.STUDENT) {
            // Attach a placeholder Project so the student is reachable from the cycle.
            // Mirrors AuthService.schedulePlaceholderAttach: register the call as an
            // after-commit synchronisation when a parent transaction exists (the
            // inline INSERT would deadlock — parent tx holds an X lock on user_account
            // until commit, so the inner INSERT can't read it for FK validation);
            // otherwise call inline so the controller-without-@Transactional path
            // still attaches. Without the inline branch the attach was silently
            // skipped for every PENDING student approved through the User Management
            // queue, which is why the active cycle showed 0 students.
            final Long sid = user.getUserId();
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCommit() {
                        try {
                            UserAccount fresh = userRepository.findById(sid).orElse(null);
                            if (fresh != null) cycleLifecycleService.attachStudentToActiveFyp1(fresh);
                        } catch (Exception e) {
                            log.warn("Placeholder attach (after-commit) failed for approved user {}: {}", sid, e.getMessage());
                        }
                    }
                });
            } else {
                try {
                    UserAccount fresh = userRepository.findById(sid).orElse(null);
                    if (fresh != null) cycleLifecycleService.attachStudentToActiveFyp1(fresh);
                } catch (Exception e) {
                    log.warn("Placeholder attach (inline) failed for approved user {}: {}", sid, e.getMessage());
                }
            }
        }
        notificationService.createNotification(
                user.getUserId(),
                "ACCOUNT_APPROVED",
                "Account approved",
                "Your " + user.getRole().name().toLowerCase() + " account has been approved. You can now sign in.",
                "/login"
        );
        return ResponseEntity.ok(Map.of("success", true, "userId", user.getUserId(), "status", "ACTIVE"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRegistration(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails admin,
            HttpServletRequest httpRequest,
            @RequestBody(required = false) Map<String, Object> data) {
        UserAccount user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getStatus() != UserStatus.PENDING) {
            throw new BadRequestException("User is not pending approval");
        }
        String reason = data != null && data.get("reason") != null ? data.get("reason").toString() : "No reason given";
        user.setStatus(UserStatus.BLOCKED);
        userRepository.save(user);
        UserAccount adminUser = adminFromPrincipal(admin);
        auditService.record(adminUser, "USER_REJECTED", "USER_ACCOUNT", String.valueOf(id),
                "rejected " + user.getEmail() + " — reason: " + reason, httpRequest);
        notificationService.createNotification(
                user.getUserId(),
                "ACCOUNT_REJECTED",
                "Registration rejected",
                "Your account registration was rejected. Reason: " + reason,
                "/login"
        );
        return ResponseEntity.ok(Map.of("success", true, "userId", user.getUserId(), "status", "BLOCKED"));
    }

    /** Resolve the admin principal to a UserAccount (for audit-log actor field). */
    private UserAccount adminFromPrincipal(UserDetails principal) {
        if (principal == null) return null;
        try {
            return userRepository.findById(Long.parseLong(principal.getUsername())).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, Object> buildPendingDto(UserAccount user) {
        String department = "";
        String programme = "";
        if (user.getRole() == UserRole.STUDENT) {
            StudentProfile sp = studentProfileRepository.findById(user.getUserId()).orElse(null);
            if (sp != null) {
                department = sp.getFaculty() != null ? sp.getFaculty() : "";
                programme = sp.getProgramme() != null ? sp.getProgramme() : "";
            }
        } else if (user.getRole() == UserRole.SUPERVISOR) {
            SupervisorProfile svp = supervisorProfileRepository.findById(user.getUserId()).orElse(null);
            if (svp != null) {
                department = svp.getDepartment() != null ? svp.getDepartment() : "";
            }
        }
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("userId", user.getUserId().toString());
        dto.put("mmuId", user.getMmuId());
        dto.put("email", user.getEmail());
        dto.put("fullName", user.getFullName());
        dto.put("phone", user.getPhone());
        dto.put("role", user.getRole().name());
        dto.put("department", department);
        dto.put("programme", programme);
        dto.put("registeredAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        return dto;
    }
}
