package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminService adminService;

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
}
