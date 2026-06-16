package com.fyp.supervision.service;

import com.fyp.supervision.dto.auth.RegisterRequest;
import com.fyp.supervision.dto.auth.ResendRegistrationOtpRequest;
import com.fyp.supervision.dto.auth.VerifyRegistrationRequest;
import com.fyp.supervision.entity.PendingRegistration;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ConflictException;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceRegistrationTest {

    @Mock UserAccountRepository userAccountRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock SupervisorProfileRepository supervisorProfileRepository;
    @Mock ApprovedStudentRosterRepository approvedStudentRosterRepository;
    @Mock ApprovedSupervisorRosterRepository approvedSupervisorRosterRepository;
    @Mock ProjectRepository projectRepository;
    @Mock FypCycleRepository fypCycleRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock PendingRegistrationRepository pendingRegistrationRepository;
    @Mock NotificationService notificationService;
    @Mock EmailService emailService;
    @Mock CycleLifecycleService cycleLifecycleService;
    @Mock AuditService auditService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;

    @InjectMocks AuthService service;

    private static final String EMAIL = "1201234567@student.mmu.edu.my";
    private static final String MMU_ID = "1201234567";

    private RegisterRequest studentRequest() {
        RegisterRequest r = new RegisterRequest();
        r.setRole("STUDENT");
        r.setFullName("Test Student");
        r.setMmuId(MMU_ID);
        r.setEmail(EMAIL);
        r.setPassword("Password1");
        r.setSpecialisation("Software Engineering");
        r.setIntakeYear(2024);
        r.setAcceptedPrivacyNotice(true);
        r.setPrivacyNoticeVersion("v1");
        return r;
    }

    private VerifyRegistrationRequest verifyReq(String code) {
        VerifyRegistrationRequest r = new VerifyRegistrationRequest();
        r.setEmail(EMAIL);
        r.setCode(code);
        return r;
    }

    /** Build a pending row whose OTP hash matches {@code code}. */
    private PendingRegistration pendingFor(String code) {
        LocalDateTime now = LocalDateTime.now();
        return PendingRegistration.builder()
                .id(1L)
                .email(EMAIL)
                .mmuId(MMU_ID)
                .role("STUDENT")
                .fullName("Test Student")
                .passwordHash("bcrypt-hash")
                .specialisation("Software Engineering")
                .intakeYear(2024)
                .privacyNoticeVersion("v1")
                .termsAcceptedAt(now)
                .otpHash(sha256Hex(code))
                .attempts(0)
                .expiresAt(now.plusMinutes(10))
                .lastSentAt(now)
                .build();
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    void register_stashesPendingAndCreatesNoAccount() {
        when(userAccountRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(userAccountRepository.existsByMmuId(MMU_ID)).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("bcrypt-hash");
        when(pendingRegistrationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        String msg = service.register(studentRequest());

        assertThat(msg).contains(EMAIL);
        // No account is created until the code is verified.
        verify(userAccountRepository, never()).save(any());
        // Old pending rows for this email are purged before the new one is saved.
        verify(pendingRegistrationRepository).deleteAllByEmail(EMAIL);

        ArgumentCaptor<PendingRegistration> cap = ArgumentCaptor.forClass(PendingRegistration.class);
        verify(pendingRegistrationRepository).save(cap.capture());
        PendingRegistration saved = cap.getValue();
        assertThat(saved.getEmail()).isEqualTo(EMAIL);
        assertThat(saved.getMmuId()).isEqualTo(MMU_ID);
        assertThat(saved.getPasswordHash()).isEqualTo("bcrypt-hash"); // never plaintext
        assertThat(saved.getOtpHash()).hasSize(64);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now());

        verify(emailService).sendRegistrationOtpEmail(eq(EMAIL), anyString(), anyString());
    }

    @Test
    void register_duplicateEmail_throwsConflictAndStashesNothing() {
        when(userAccountRepository.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> service.register(studentRequest()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Email is already registered");

        verify(pendingRegistrationRepository, never()).save(any());
        verify(emailService, never()).sendRegistrationOtpEmail(anyString(), anyString(), anyString());
    }

    @Test
    void verify_correctCode_createsAccountAndClearsPending() {
        when(pendingRegistrationRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pendingFor("123456")));
        when(userAccountRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(userAccountRepository.existsByMmuId(MMU_ID)).thenReturn(false);
        // not on the roster -> PENDING
        when(approvedStudentRosterRepository.findByMmuIdAndEmail(MMU_ID, EMAIL)).thenReturn(Optional.empty());
        when(userAccountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = service.verifyRegistration(verifyReq("123456"));

        assertThat(result.get("status")).isEqualTo("PENDING");
        ArgumentCaptor<UserAccount> cap = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).save(cap.capture());
        assertThat(cap.getValue().getEmail()).isEqualTo(EMAIL);
        assertThat(cap.getValue().getPasswordHash()).isEqualTo("bcrypt-hash"); // reused, not re-encoded
        assertThat(cap.getValue().getStatus()).isEqualTo(UserStatus.PENDING);
        verify(studentProfileRepository).save(any());
        verify(pendingRegistrationRepository).deleteAllByEmail(EMAIL);
    }

    @Test
    void verify_wrongCode_incrementsAttemptsAndKeepsPending() {
        PendingRegistration pending = pendingFor("123456");
        when(pendingRegistrationRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.verifyRegistration(verifyReq("000000")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Incorrect code");

        assertThat(pending.getAttempts()).isEqualTo(1);
        verify(pendingRegistrationRepository).save(pending);
        verify(userAccountRepository, never()).save(any());
        verify(pendingRegistrationRepository, never()).deleteAllByEmail(anyString());
    }

    @Test
    void verify_fifthWrongCode_burnsPending() {
        PendingRegistration pending = pendingFor("123456");
        pending.setAttempts(4); // next wrong attempt hits the cap
        when(pendingRegistrationRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.verifyRegistration(verifyReq("000000")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Too many incorrect attempts");

        verify(pendingRegistrationRepository).deleteAllByEmail(EMAIL);
        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void verify_expiredCode_rejectedAndDeleted() {
        PendingRegistration pending = pendingFor("123456");
        pending.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(pendingRegistrationRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.verifyRegistration(verifyReq("123456")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");

        verify(pendingRegistrationRepository).deleteAllByEmail(EMAIL);
        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void verify_noPendingRow_throws() {
        when(pendingRegistrationRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifyRegistration(verifyReq("123456")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No pending registration");
    }

    @Test
    void resend_withinCooldown_throws() {
        PendingRegistration pending = pendingFor("123456");
        pending.setLastSentAt(LocalDateTime.now()); // just sent
        when(pendingRegistrationRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pending));

        ResendRegistrationOtpRequest req = new ResendRegistrationOtpRequest();
        req.setEmail(EMAIL);

        assertThatThrownBy(() -> service.resendRegistrationOtp(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("wait");

        verify(emailService, never()).sendRegistrationOtpEmail(anyString(), anyString(), anyString());
    }

    @Test
    void resend_afterCooldown_reissuesCode() {
        PendingRegistration pending = pendingFor("123456");
        String oldHash = pending.getOtpHash();
        pending.setLastSentAt(LocalDateTime.now().minusSeconds(120));
        when(pendingRegistrationRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pending));

        ResendRegistrationOtpRequest req = new ResendRegistrationOtpRequest();
        req.setEmail(EMAIL);

        service.resendRegistrationOtp(req);

        assertThat(pending.getOtpHash()).isNotEqualTo(oldHash); // a fresh code was issued
        assertThat(pending.getAttempts()).isZero();
        verify(pendingRegistrationRepository).save(pending);
        verify(emailService, times(1)).sendRegistrationOtpEmail(eq(EMAIL), anyString(), anyString());
    }
}
