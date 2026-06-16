package com.fyp.supervision.service;

import com.fyp.supervision.dto.auth.*;
import com.fyp.supervision.dto.common.UserDto;
import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.PasswordResetToken;
import com.fyp.supervision.entity.PendingRegistration;
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
import com.fyp.supervision.repository.PendingRegistrationRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long RESET_TOKEN_TTL_MINUTES = 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** Pending-registration OTP tuning. A 6-digit code has only 1M values, so the
     *  attempt cap is the real brute-force defence; the TTL bounds the guessing window. */
    private static final long REGISTRATION_OTP_TTL_MINUTES = 10;
    private static final int  MAX_OTP_ATTEMPTS = 5;
    private static final long RESEND_COOLDOWN_SECONDS = 60;

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ApprovedStudentRosterRepository approvedStudentRosterRepository;
    private final ApprovedSupervisorRosterRepository approvedSupervisorRosterRepository;
    private final ProjectRepository projectRepository;
    private final FypCycleRepository fypCycleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CycleLifecycleService cycleLifecycleService;
    private final AuditService auditService;

    /**
     * Step 1 of registration. Validates the request and stashes it (with the password
     * already bcrypt'd and a hashed 6-digit OTP) in {@code pending_registration}, then
     * emails the code. <strong>No {@code user_account} is created here</strong> — the
     * email / MMU ID stay free to register so a real student can never be locked out by
     * someone else's unverified attempt. The account is created only in
     * {@link #verifyRegistration} once the code is entered.
     */
    @Transactional
    public String register(RegisterRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String mmuId = request.getMmuId() == null ? "" : request.getMmuId().trim().toUpperCase();

        if (userAccountRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered.");
        }
        if (userAccountRepository.existsByMmuId(mmuId)) {
            throw new ConflictException("MMU ID is already registered.");
        }

        UserRole role = parseSelfRegisterRole(request.getRole());
        requireRoleDomainMatch(role, email);

        // Consent capture (PDPA). The DTO already enforces acceptedPrivacyNotice == true
        // via @AssertTrue, so reaching here means the user ticked the box. Record the
        // exact timestamp + version they agreed to for audit (carried onto the account).
        String pnVersion = request.getPrivacyNoticeVersion() == null
                ? "v1"
                : request.getPrivacyNoticeVersion().trim();

        // One live pending row per email — a fresh start supersedes any earlier attempt
        // (including an attacker's), so the code always lands in the rightful mailbox.
        pendingRegistrationRepository.deleteAllByEmail(email);

        String code = generateOtpCode();
        LocalDateTime now = LocalDateTime.now();

        PendingRegistration pending = PendingRegistration.builder()
                .email(email)
                .mmuId(mmuId)
                .role(role.name())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .specialisation(request.getSpecialisation())
                .intakeYear(request.getIntakeYear())
                .privacyNoticeVersion(pnVersion)
                .termsAcceptedAt(now)
                .otpHash(sha256Hex(code))
                .expiresAt(now.plusMinutes(REGISTRATION_OTP_TTL_MINUTES))
                .lastSentAt(now)
                .build();
        pendingRegistrationRepository.save(pending);

        emailService.sendRegistrationOtpEmail(email, request.getFullName(), code);

        return "We've emailed a 6-digit verification code to " + email
                + ". Enter it to finish creating your account.";
    }

    /**
     * Step 2 of registration. Verifies the OTP for a pending registration and, only on
     * success, creates the real {@code user_account} (running the same roster
     * auto-approve / pending-admin logic that the old single-step register did).
     *
     * @return a map with {@code status} ("ACTIVE" | "PENDING") and a user-facing {@code message}.
     */
    @Transactional
    public Map<String, Object> verifyRegistration(VerifyRegistrationRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String code = request.getCode() == null ? "" : request.getCode().trim();

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(
                        "No pending registration for this email. Please register again."));

        if (pending.getUsedAt() != null) {
            throw new BadRequestException("This registration has already been completed. Please sign in.");
        }
        if (pending.getExpiresAt() == null || pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingRegistrationRepository.deleteAllByEmail(email);
            throw new BadRequestException("This code has expired. Please register again to get a new one.");
        }

        if (!sha256Hex(code).equals(pending.getOtpHash())) {
            int attempts = (pending.getAttempts() == null ? 0 : pending.getAttempts()) + 1;
            if (attempts >= MAX_OTP_ATTEMPTS) {
                pendingRegistrationRepository.deleteAllByEmail(email);
                throw new BadRequestException(
                        "Too many incorrect attempts. Please register again to get a new code.");
            }
            pending.setAttempts(attempts);
            pendingRegistrationRepository.save(pending);
            int left = MAX_OTP_ATTEMPTS - attempts;
            throw new BadRequestException(
                    "Incorrect code. " + left + " attempt" + (left == 1 ? "" : "s") + " remaining.");
        }

        // Code is correct. Re-check duplicates — a real account for this email/MMU ID
        // could have been created in the window since the code was issued.
        if (userAccountRepository.existsByEmail(email)) {
            pendingRegistrationRepository.deleteAllByEmail(email);
            throw new ConflictException("Email is already registered.");
        }
        if (userAccountRepository.existsByMmuId(pending.getMmuId())) {
            pendingRegistrationRepository.deleteAllByEmail(email);
            throw new ConflictException("MMU ID is already registered.");
        }

        AccountCreationOutcome outcome = createAccountFromPending(pending);

        // Done — drop the pending row (don't keep the duplicated bcrypt hash around).
        pendingRegistrationRepository.deleteAllByEmail(email);

        Map<String, Object> result = new HashMap<>();
        result.put("status", outcome.status().name());
        result.put("message", outcome.message());
        return result;
    }

    /**
     * Re-issues a fresh OTP for an in-progress registration, subject to a resend
     * cooldown. Returns a generic message regardless of whether a pending row exists,
     * to avoid leaking which emails are mid-registration.
     */
    @Transactional
    public String resendRegistrationOtp(ResendRegistrationOtpRequest request) {
        String genericResponse =
                "If a registration is awaiting verification for that email, a new code has been sent.";
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (email.isBlank()) {
            return genericResponse;
        }

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(email).orElse(null);
        if (pending == null || pending.getUsedAt() != null) {
            return genericResponse;
        }

        LocalDateTime now = LocalDateTime.now();
        if (pending.getLastSentAt() != null
                && pending.getLastSentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(now)) {
            long wait = java.time.Duration.between(
                    now, pending.getLastSentAt().plusSeconds(RESEND_COOLDOWN_SECONDS)).getSeconds() + 1;
            throw new BadRequestException(
                    "Please wait " + wait + " second" + (wait == 1 ? "" : "s") + " before requesting another code.");
        }

        String code = generateOtpCode();
        pending.setOtpHash(sha256Hex(code));
        pending.setExpiresAt(now.plusMinutes(REGISTRATION_OTP_TTL_MINUTES));
        pending.setLastSentAt(now);
        pending.setAttempts(0);
        pendingRegistrationRepository.save(pending);

        emailService.sendRegistrationOtpEmail(email, pending.getFullName(), code);
        return genericResponse;
    }

    /** Outcome of materialising a verified pending registration into a real account. */
    private record AccountCreationOutcome(UserStatus status, String message) {}

    /**
     * Materialises a verified {@link PendingRegistration} into a real {@code user_account}
     * plus its role profile. The pre-approve / pending-admin behaviour is identical to the
     * old single-step register — only the inputs moved from the request to the pending row.
     */
    private AccountCreationOutcome createAccountFromPending(PendingRegistration pending) {
        UserRole role = UserRole.valueOf(pending.getRole());
        String email = pending.getEmail();
        String mmuId = pending.getMmuId();

        // Pre-approved roster lookup. Match requires both mmuId and email so a leaked CSV row can't unlock a different account.
        boolean preApproved = role == UserRole.STUDENT
                ? approvedStudentRosterRepository.findByMmuIdAndEmail(mmuId, email).isPresent()
                : approvedSupervisorRosterRepository.findByMmuIdAndEmail(mmuId, email).isPresent();

        UserStatus initialStatus = preApproved ? UserStatus.ACTIVE : UserStatus.PENDING;

        UserAccount user = UserAccount.builder()
                .mmuId(mmuId)
                .email(email)
                .passwordHash(pending.getPasswordHash()) // already bcrypt'd at register time
                .fullName(pending.getFullName())
                .phone(pending.getPhone())
                .role(role)
                .status(initialStatus)
                .termsAcceptedAt(pending.getTermsAcceptedAt())
                .privacyNoticeVersion(pending.getPrivacyNoticeVersion())
                .build();
        userAccountRepository.save(user);

        // Create role-specific profile
        if (role == UserRole.STUDENT) {
            StudentProfile profile = StudentProfile.builder()
                    .user(user)
                    .specialisation(pending.getSpecialisation())
                    .intakeYear(pending.getIntakeYear())
                    .programme(programmeForSpecialisation(pending.getSpecialisation()))
                    .faculty(facultyForSpecialisation(pending.getSpecialisation()))
                    .expectedGraduation(expectedGraduationFor(pending.getIntakeYear()))
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
            if (role == UserRole.STUDENT) {
                // Defer the placeholder Project attach to AFTER this transaction commits.
                // Calling it inline (even via REQUIRES_NEW) deadlocks: the inner
                // transaction's INSERT into project needs to read the new user_account row
                // for FK validation, but this transaction holds an X lock on that row until
                // commit, so the inner INSERT times out at innodb_lock_wait_timeout.
                // After-commit synchronization runs in a fresh tx with the user_account
                // already visible.
                schedulePlaceholderAttach(user.getUserId());
            }
            return new AccountCreationOutcome(UserStatus.ACTIVE,
                    "Registration successful. Your account has been auto-approved — you can now sign in.");
        }

        // Notify all system admins so they can approve from the registration queue.
        userAccountRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.SYSTEM_ADMIN && u.getStatus() == UserStatus.ACTIVE)
                .forEach(admin -> notificationService.createNotification(
                        admin.getUserId(),
                        "REGISTRATION_PENDING",
                        "New " + role.name().toLowerCase() + " registration",
                        pending.getFullName() + " (" + mmuId + ") needs approval.",
                        "/admin/registrations"
                ));

        return new AccountCreationOutcome(UserStatus.PENDING,
                "Registration successful. Your account is pending approval.");
    }

    /** Parses the self-registration role string, rejecting anything but STUDENT / SUPERVISOR. */
    private UserRole parseSelfRegisterRole(String raw) {
        UserRole role;
        try {
            role = UserRole.valueOf(raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role. Must be STUDENT or SUPERVISOR.");
        }
        if (role != UserRole.STUDENT && role != UserRole.SUPERVISOR) {
            throw new BadRequestException("Only STUDENT and SUPERVISOR roles can self-register.");
        }
        return role;
    }

    /** Role / domain pairing — students use @student.mmu.edu.my, staff use @mmu.edu.my (and not the student subdomain). */
    private void requireRoleDomainMatch(UserRole role, String email) {
        if (role == UserRole.STUDENT && !email.endsWith("@student.mmu.edu.my")) {
            throw new BadRequestException("Students must register with a @student.mmu.edu.my email address.");
        }
        if (role == UserRole.SUPERVISOR
                && (!email.endsWith("@mmu.edu.my") || email.endsWith("@student.mmu.edu.my"))) {
            throw new BadRequestException("Supervisors must register with a @mmu.edu.my email address.");
        }
    }

    /** A zero-padded 6-digit code, e.g. "048213". */
    private static String generateOtpCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    /**
     * Register an after-commit hook that attaches the student to the active FYP1 cycle in
     * a fresh transaction. The user_account row is fully committed by then, so the inner
     * INSERT into project (which references it via FK) doesn't deadlock against the
     * register transaction's row lock. Best-effort — failures are logged, not rethrown.
     *
     * <p>Falls back to inline call when there is no active synchronization (e.g. unit
     * tests bypassing @Transactional) — same best-effort semantics.
     */
    /**
     * Pulls the inbound HTTP request out of Spring's request scope so service-layer
     * methods can hand it to AuditService without changing every caller's signature.
     * Returns null when called outside a web request (e.g. scheduled job, unit test).
     */
    private HttpServletRequest currentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes)
                    RequestContextHolder.getRequestAttributes();
            return attrs == null ? null : attrs.getRequest();
        } catch (Exception e) {
            return null;
        }
    }

    private void schedulePlaceholderAttach(Long studentUserId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    UserAccount fresh = userAccountRepository.findById(studentUserId).orElse(null);
                    if (fresh == null) return;
                    try {
                        cycleLifecycleService.attachStudentToActiveFyp1(fresh);
                    } catch (Exception e) {
                        log.warn("Placeholder attach (after-commit) failed for user {}: {}",
                                studentUserId, e.getMessage());
                    }
                }
            });
        } else {
            try {
                UserAccount fresh = userAccountRepository.findById(studentUserId).orElse(null);
                if (fresh != null) cycleLifecycleService.attachStudentToActiveFyp1(fresh);
            } catch (Exception e) {
                log.warn("Placeholder attach (inline) failed for user {}: {}", studentUserId, e.getMessage());
            }
        }
    }

    /** Login throttle: this many consecutive failed attempts triggers a lockout. */
    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    /** Length of each lockout window. After it passes, the account becomes usable again. */
    private static final int LOCKOUT_WINDOW_MINUTES = 15;

    // noRollbackFor: when the password is wrong we increment loginAttempts then throw
    // BadCredentialsException. Spring's default rolls back any RuntimeException, which
    // would discard the increment and the throttle would never engage. Same goes for the
    // BadRequestException paths (lockout, status checks) — list both so any pre-throw
    // saves stick.
    @Transactional(noRollbackFor = { BadCredentialsException.class, BadRequestException.class })
    public LoginResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().toLowerCase().trim();

        HttpServletRequest httpRequest = currentRequest();

        // Generic "invalid credentials" for unknown identifier — never reveal whether
        // the email/mmuId exists in the system. No counter to bump. We do still audit
        // the attempt so admins can spot enumeration patterns.
        UserAccount user = userAccountRepository.findByEmailOrMmuId(identifier).orElse(null);
        if (user == null) {
            auditService.recordAnonymous("LOGIN_FAILURE_UNKNOWN_USER", "USER_ACCOUNT", null,
                    "identifier=" + identifier, httpRequest);
            throw new BadCredentialsException("Invalid credentials.");
        }

        // Throttle: reject early when the account is in an active lockout window.
        LocalDateTime now = LocalDateTime.now();
        if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(now)) {
            long minutesLeft = java.time.Duration.between(now, user.getLockoutUntil()).toMinutes() + 1;
            auditService.record(user, "LOGIN_REJECTED_LOCKED", "USER_ACCOUNT",
                    String.valueOf(user.getUserId()),
                    "lockoutUntil=" + user.getLockoutUntil(), httpRequest);
            throw new BadRequestException(
                    "Account temporarily locked after too many failed attempts. Try again in "
                            + minutesLeft + " minute" + (minutesLeft == 1 ? "" : "s") + ".");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Increment the attempt counter; lock if we've now hit the threshold.
            int attempts = (user.getLoginAttempts() == null ? 0 : user.getLoginAttempts()) + 1;
            boolean justLocked = false;
            if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
                user.setLoginAttempts(0);
                user.setLockoutUntil(now.plusMinutes(LOCKOUT_WINDOW_MINUTES));
                justLocked = true;
            } else {
                user.setLoginAttempts(attempts);
            }
            userAccountRepository.save(user);
            if (justLocked) {
                auditService.record(user, "LOGIN_LOCKOUT_TRIGGERED", "USER_ACCOUNT",
                        String.valueOf(user.getUserId()),
                        "after " + MAX_FAILED_LOGIN_ATTEMPTS + " failed attempts", httpRequest);
            } else {
                auditService.record(user, "LOGIN_FAILURE", "USER_ACCOUNT",
                        String.valueOf(user.getUserId()),
                        "attempts=" + attempts, httpRequest);
            }
            throw new BadCredentialsException("Invalid credentials.");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new BadRequestException("Your account is pending approval. Please wait for administrator approval.");
        }

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BLOCKED) {
            throw new BadRequestException("Your account has been " + user.getStatus().name().toLowerCase() + ". Please contact the administrator.");
        }

        // Successful login — reset throttle counters and stamp last_login_at.
        user.setLoginAttempts(0);
        user.setLockoutUntil(null);
        user.setLastLoginAt(now);
        userAccountRepository.save(user);
        auditService.record(user, "LOGIN_SUCCESS", "USER_ACCOUNT",
                String.valueOf(user.getUserId()), null, httpRequest);

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

    /**
     * Records the user's acceptance of a (possibly new) privacy notice version.
     * Used by the in-app re-consent gate when PRIVACY_NOTICE_VERSION is bumped.
     */
    @Transactional
    public UserDto acceptPrivacyNotice(Long userId, String version) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.setPrivacyNoticeVersion(version == null ? "v1" : version.trim());
        user.setTermsAcceptedAt(LocalDateTime.now());
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

    /**
     * Maps a specialisation to its parent programme. Information Systems sits under
     * Bachelor of Information Technology (Honours); the other four specialisations
     * sit under Bachelor of Computer Science (Hons.). All FCI.
     */
    static String programmeForSpecialisation(String specialisation) {
        if (specialisation == null) return null;
        if ("Information Systems".equalsIgnoreCase(specialisation.trim())) {
            return "Bachelor of Information Technology (Honours)";
        }
        return "Bachelor of Computer Science (Hons.)";
    }

    static String facultyForSpecialisation(String specialisation) {
        return specialisation == null ? null : "FCI";
    }

    /** intakeYear + 3 → expected graduation year as a string. */
    static String expectedGraduationFor(Integer intakeYear) {
        return intakeYear == null ? null : String.valueOf(intakeYear + 3);
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
