package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.FileStorageService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/student/profile")
@RequiredArgsConstructor
public class StudentProfileController {
    private final StudentService studentService;
    private final FileStorageService fileStorageService;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getProfileDto(userId));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> updates) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.updateProfile(userId, updates));
    }

    @PostMapping("/image")
    public ResponseEntity<?> uploadProfileImage(@AuthenticationPrincipal UserDetails user, @RequestParam("file") MultipartFile file) {
        Long userId = Long.parseLong(user.getUsername());
        String path = fileStorageService.storeImage(file, "profiles", userId);
        UserAccount account = userAccountRepository.findById(userId).orElseThrow();
        account.setProfileImagePath(path);
        userAccountRepository.save(account);
        return ResponseEntity.ok(Map.of("imageUrl", path));
    }
}
