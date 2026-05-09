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
import com.fyp.supervision.service.AdminService;
import com.fyp.supervision.service.CycleLifecycleService;
import com.fyp.supervision.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserAccountRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminService adminService;
    private final NotificationService notificationService;
    private final CycleLifecycleService cycleLifecycleService;

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getUserList(role, status, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserDetail(id));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> data) {
        String email = (String) data.get("email");
        String mmuId = (String) data.get("mmuId");
        if (userRepository.existsByEmail(email)) throw new BadRequestException("Email already exists");
        if (userRepository.existsByMmuId(mmuId)) throw new BadRequestException("MMU ID already exists");

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
        return ResponseEntity.ok(Map.of("userId", saved.getUserId().toString()));
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
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/bulk-status")
    public ResponseEntity<?> bulkStatusUpdate(@RequestBody Map<String, Object> data) {
        @SuppressWarnings("unchecked")
        List<Number> userIds = (List<Number>) data.get("userIds");
        UserStatus status = UserStatus.valueOf((String) data.get("status"));
        List<Long> ids = userIds.stream().map(Number::longValue).toList();
        List<UserAccount> users = userRepository.findByUserIdIn(ids);
        users.forEach(u -> u.setStatus(status));
        userRepository.saveAll(users);
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
    public ResponseEntity<?> approveRegistration(@PathVariable Long id) {
        UserAccount user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getStatus() != UserStatus.PENDING) {
            throw new BadRequestException("User is not pending approval");
        }
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        if (user.getRole() == UserRole.STUDENT) {
            cycleLifecycleService.attachStudentToActiveFyp1(user);
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
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> data) {
        UserAccount user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getStatus() != UserStatus.PENDING) {
            throw new BadRequestException("User is not pending approval");
        }
        String reason = data != null && data.get("reason") != null ? data.get("reason").toString() : "No reason given";
        user.setStatus(UserStatus.BLOCKED);
        userRepository.save(user);
        notificationService.createNotification(
                user.getUserId(),
                "ACCOUNT_REJECTED",
                "Registration rejected",
                "Your account registration was rejected. Reason: " + reason,
                "/login"
        );
        return ResponseEntity.ok(Map.of("success", true, "userId", user.getUserId(), "status", "BLOCKED"));
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
