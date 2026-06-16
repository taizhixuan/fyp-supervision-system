package com.fyp.supervision.controller;

import com.fyp.supervision.dto.auth.*;
import com.fyp.supervision.dto.common.MessageResponse;
import com.fyp.supervision.dto.common.UserDto;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AuthService;
import com.fyp.supervision.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final FileStorageService fileStorageService;
    private final UserAccountRepository userAccountRepository;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse(message));
    }

    @PostMapping("/register/verify")
    public ResponseEntity<Map<String, Object>> verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request) {
        Map<String, Object> result = authService.verifyRegistration(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/register/resend")
    public ResponseEntity<MessageResponse> resendRegistrationOtp(@Valid @RequestBody ResendRegistrationOtpRequest request) {
        String message = authService.resendRegistrationOtp(request);
        return ResponseEntity.ok(new MessageResponse(message));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Stateless JWT — client simply discards the token
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        UserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        authService.changePassword(userId, request);
        return ResponseEntity.ok(new MessageResponse("Password changed successfully."));
    }

    @PutMapping("/update-profile")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        UserDto user = authService.updateProfile(userId, request);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/accept-privacy-notice")
    public ResponseEntity<UserDto> acceptPrivacyNotice(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AcceptPrivacyNoticeRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(authService.acceptPrivacyNotice(userId, request.getVersion()));
    }

    @PostMapping("/profile-image")
    public ResponseEntity<?> uploadProfileImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String path = fileStorageService.storeFile(file, "profiles", userId);
        UserAccount account = userAccountRepository.findById(userId).orElseThrow();
        account.setProfileImagePath(path);
        userAccountRepository.save(account);
        return ResponseEntity.ok(Map.of("imageUrl", path));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(new MessageResponse(message));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Password reset successfully."));
    }

    @GetMapping("/verify-reset-token")
    public ResponseEntity<Map<String, Boolean>> verifyResetToken(@RequestParam String token) {
        boolean valid = authService.verifyResetToken(token);
        return ResponseEntity.ok(Map.of("valid", valid));
    }
}
