package com.fyp.supervision.service;

import com.fyp.supervision.dto.auth.*;
import com.fyp.supervision.dto.common.UserDto;
import com.fyp.supervision.entity.FypCycle;
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
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ProjectRepository projectRepository;
    private final FypCycleRepository fypCycleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public String register(RegisterRequest request) {
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered.");
        }
        if (userAccountRepository.existsByMmuId(request.getMmuId())) {
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

        UserAccount user = UserAccount.builder()
                .mmuId(request.getMmuId())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(role)
                .status(UserStatus.PENDING)
                .build();

        userAccountRepository.save(user);

        // Create role-specific profile
        if (role == UserRole.STUDENT) {
            StudentProfile profile = StudentProfile.builder()
                    .user(user)
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

    public String forgotPassword(ForgotPasswordRequest request) {
        // Always return success to prevent email enumeration
        // In production, send a reset email if the user exists
        return "If an account with that email exists, a password reset link has been sent.";
    }

    public void resetPassword(ResetPasswordRequest request) {
        // Token-based password reset - not fully implemented in MVP
        throw new BadRequestException("Password reset via token is not yet implemented. Please contact the administrator.");
    }

    public boolean verifyResetToken(String token) {
        // Not fully implemented in MVP
        return false;
    }
}
