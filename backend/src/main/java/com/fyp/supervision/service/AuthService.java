package com.fyp.supervision.service;

import com.fyp.supervision.dto.auth.*;
import com.fyp.supervision.dto.common.UserDto;
import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.PasswordResetToken;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ConflictException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ApprovedStudentRosterRepository;
import com.fyp.supervision.repository.ApprovedSupervisorRosterRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.PasswordResetTokenRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long RESET_TOKEN_TTL_MINUTES = 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ApprovedStudentRosterRepository approvedStudentRosterRepository;
    private final ApprovedSupervisorRosterRepository approvedSupervisorRosterRepository;
    private final ProjectRepository projectRepository;
    private final FypCycleRepository fypCycleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public String register(RegisterRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String mmuId = request.getMmuId() == null ? "" : request.getMmuId().trim();

        if (userAccountRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered.");
        }
        if (userAccountRepository.existsByMmuId(mmuId)) {
            throw new ConflictException("MMU ID is already registered.");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role. Must be STUDENT or SUPERVISOR.");
        }

        if (role != UserRole.STUDENT && role != UserRole.SUPERVISOR) {
            throw new BadRequestException("Only STUDENT and SUPERVISOR roles can self-register.");
        }

        // Role / domain pairing — students use @student.mmu.edu.my, staff use @mmu.edu.my (and not the student subdomain).
        if (role == UserRole.STUDENT && !email.endsWith("@student.mmu.edu.my")) {
            throw new BadRequestException("Students must register with a @student.mmu.edu.my email address.");
        }
        if (role == UserRole.SUPERVISOR
                && (!email.endsWith("@mmu.edu.my") || email.endsWith("@student.mmu.edu.my"))) {
            throw new BadRequestException("Supervisors must register with a @mmu.edu.my email address.");
        }

        // Pre-approved roster lookup. Match requires both mmuId and email so a leaked CSV row can't unlock a different account.
        boolean preApproved = role == UserRole.STUDENT
                ? approvedStudentRosterRepository.findByMmuIdAndEmail(mmuId, email).isPresent()
                : approvedSupervisorRosterRepository.findByMmuIdAndEmail(mmuId, email).isPresent();

        UserStatus initialStatus = preApproved ? UserStatus.ACTIVE : UserStatus.PENDING;

        UserAccount user = UserAccount.builder()
                .mmuId(mmuId)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(role)
                .status(initialStatus)
                .build();

        userAccountRepository.save(user);

        // Create role-specific profile
        if (role == UserRole.STUDENT) {
            StudentProfile profile = StudentProfile.builder()
                    .user(user)
                    .specialisation(request.getSpecialisation())
                    .intakeYear(request.getIntakeYear())
                    .build();
            studentProfileRepository.save(profile);
        } else {
            SupervisorProfile profile = SupervisorProfile.builder()
                    .user(user)
                    .supervisionQuota(8)
                    .currentLoad(0)
                    .availabilityStatus("AVAILABLE")
                    .build();
            supervisorProfileRepository.save(profile);
        }

        if (preApproved) {
            return "Registration successful. Your account has been auto-approved — you can now sign in.";
        }

        // Notify all system admins so they can approve from the registration queue.
        userAccountRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.SYSTEM_ADMIN && u.getStatus() == UserStatus.ACTIVE)
                .forEach(admin -> notificationService.createNotification(
                        admin.getUserId(),
                        "REGISTRATION_PENDING",
                        "New " + role.name().toLowerCase() + " registration",
                        request.getFullName() + " (" + mmuId + ") needs approval.",
                        "/admin/registrations"
                ));

        return "Registration successful. Your account is pending approval.";
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().toLowerCase().trim();

        UserAccount user = userAccountRepository.findByEmailOrMmuId(identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials.");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new BadRequestException("Your account is pending approval. Please wait for administrator approval.");
        }

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BLOCKED) {
            throw new BadRequestException("Your account has been " + user.getStatus().name().toLowerCase() + ". Please contact the administrator.");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userAccountRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());

        String currentPhase = null;
        Boolean fyp1Passed = null;
        if (user.getRole() == UserRole.STUDENT) {
            Project project = projectRepository.findByStudent_UserId(user.getUserId()).orElse(null);
            if (project != null) {
                fyp1Passed = project.getFyp1Passed();
                String stage = project.getStage();
                boolean alreadyFyp2 = stage != null && (stage.equalsIgnoreCase("FYP2") || stage.equalsIgnoreCase("FYP 2"));
                // Auto-advance: if passed and an active FYP2 cycle exists, flip the project to FYP2.
                if (!alreadyFyp2 && Boolean.TRUE.equals(fyp1Passed)) {
                    boolean fyp2CycleActive = fypCycleRepository.findAll().stream()
                            .anyMatch(c -> c.getStatus() == CycleStatus.ACTIVE
                                    && c.getCycleType() != null
                                    && c.getCycleType().equalsIgnoreCase("FYP2"));
                    if (fyp2CycleActive) {
                        project.setStage("FYP2");
                        projectRepository.save(project);
                        currentPhase = "FYP2";
                    } else {
                        currentPhase = "FYP1";
                    }
                } else {
                    currentPhase = alreadyFyp2 ? "FYP2" : "FYP1";
                }
            }
        }

        return new LoginResponse(token, UserDto.fromEntity(user), currentPhase, fyp1Passed);
    }

    public UserDto getCurrentUser(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);
    }

    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userAccountRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email is already in use.");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        userAccountRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String genericResponse = "If an account with that email exists, a password reset link has been sent.";
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return genericResponse;
        }
        String email = request.getEmail().toLowerCase().trim();

        userAccountRepository.findByEmail(email).ifPresent(user -> {
            passwordResetTokenRepository.deleteAllByUserId(user.getUserId());

            byte[] randomBytes = new byte[32];
            SECURE_RANDOM.nextBytes(randomBytes);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

            PasswordResetToken record = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(sha256Hex(rawToken))
                    .expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_TTL_MINUTES))
                    .build();
            passwordResetTokenRepository.save(record);

            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), rawToken);
        });

        return genericResponse;
    }

    public boolean verifyResetToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return passwordResetTokenRepository.findByTokenHash(sha256Hex(token))
                .map(record -> record.getUsedAt() == null
                        && record.getExpiresAt() != null
                        && record.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new BadRequestException("Reset token is required.");
        }
        PasswordResetToken record = passwordResetTokenRepository
                .findByTokenHash(sha256Hex(request.getToken()))
                .orElseThrow(() -> new BadRequestException("This reset link is invalid or has expired."));

        if (record.getUsedAt() != null) {
            throw new BadRequestException("This reset link has already been used.");
        }
        if (record.getExpiresAt() == null || record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        UserAccount user = record.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);

        record.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(record);
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
