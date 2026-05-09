package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.FileStorageService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/supervisor/profile")
@RequiredArgsConstructor
public class SupervisorProfileController {
    private final SupervisorService supervisorService;
    private final FileStorageService fileStorageService;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(supervisorService.getProfileDto(Long.parseLong(user.getUsername())));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(supervisorService.updateProfile(Long.parseLong(user.getUsername()), updates));
    }

    @PostMapping("/image")
    public ResponseEntity<?> uploadProfileImage(@AuthenticationPrincipal UserDetails user, @RequestParam("file") MultipartFile file) {
        Long userId = Long.parseLong(user.getUsername());
        String path = fileStorageService.storeFile(file, "profiles", userId);
        UserAccount account = userAccountRepository.findById(userId).orElseThrow();
        account.setProfileImagePath(path);
        userAccountRepository.save(account);
        return ResponseEntity.ok(Map.of("imageUrl", path));
    }
}
