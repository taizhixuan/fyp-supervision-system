package com.fyp.supervision.service;

import com.fyp.supervision.dto.auth.LoginRequest;
import com.fyp.supervision.dto.auth.LoginResponse;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.repository.ApprovedStudentRosterRepository;
import com.fyp.supervision.repository.ApprovedSupervisorRosterRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.PasswordResetTokenRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceLoginThrottleTest {

    @Mock UserAccountRepository userAccountRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock SupervisorProfileRepository supervisorProfileRepository;
    @Mock ApprovedStudentRosterRepository approvedStudentRosterRepository;
    @Mock ApprovedSupervisorRosterRepository approvedSupervisorRosterRepository;
    @Mock ProjectRepository projectRepository;
    @Mock FypCycleRepository fypCycleRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock NotificationService notificationService;
    @Mock EmailService emailService;
    @Mock CycleLifecycleService cycleLifecycleService;
    @Mock AuditService auditService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;

    @InjectMocks AuthService service;

    private UserAccount user;

    @BeforeEach
    void setUp() {
        user = UserAccount.builder()
                .userId(1L)
                .mmuId("2010001001")
                .email("test.user@mmu.edu.my")
                .passwordHash("hashed")
                .fullName("Test User")
                .role(UserRole.SUPERVISOR)
                .status(UserStatus.ACTIVE)
                .build();
        user.setLoginAttempts(0);
        user.setCreatedAt(LocalDateTime.now().minusDays(30));
        user.setUpdatedAt(LocalDateTime.now());
        when(userAccountRepository.findByEmailOrMmuId("test.user@mmu.edu.my"))
                .thenReturn(Optional.of(user));
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtTokenProvider.generateToken(any(), any(), any())).thenReturn("jwt-token");
    }

    private LoginRequest req(String pwd) {
        LoginRequest r = new LoginRequest();
        r.setIdentifier("test.user@mmu.edu.my");
        r.setPassword(pwd);
        return r;
    }

    @Test
    void successfulLogin_resetsAttemptsAndLockout() {
        // Pre-condition: user has 3 prior failures.
        user.setLoginAttempts(3);
        user.setLockoutUntil(null);
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);

        LoginResponse resp = service.login(req("correct"));

        assertThat(resp.getAccessToken()).isEqualTo("jwt-token");
        assertThat(user.getLoginAttempts()).isZero();
        assertThat(user.getLockoutUntil()).isNull();
    }

    @Test
    void wrongPassword_underThreshold_incrementsButDoesNotLock() {
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> service.login(req("wrong")))
                    .isInstanceOf(BadCredentialsException.class);
        }

        assertThat(user.getLoginAttempts()).isEqualTo(4);
        assertThat(user.getLockoutUntil()).isNull();
    }

    @Test
    void wrongPassword_atFifthFailure_locksAccount() {
        user.setLoginAttempts(4); // about to hit the threshold
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> service.login(req("wrong")))
                .isInstanceOf(BadCredentialsException.class);

        assertThat(user.getLoginAttempts()).isZero(); // counter reset on lockout
        assertThat(user.getLockoutUntil()).isNotNull();
        assertThat(user.getLockoutUntil()).isAfter(LocalDateTime.now());
    }

    @Test
    void lockedAccount_rejectsEvenCorrectPassword() {
        user.setLockoutUntil(LocalDateTime.now().plusMinutes(10));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);

        assertThatThrownBy(() -> service.login(req("correct")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("temporarily locked");
    }

    @Test
    void expiredLockout_allowsLoginAgain() {
        // Lockout window ended in the past — fresh attempt should succeed cleanly.
        user.setLockoutUntil(LocalDateTime.now().minusMinutes(1));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);

        assertThatCode(() -> service.login(req("correct"))).doesNotThrowAnyException();
        assertThat(user.getLockoutUntil()).isNull();
        assertThat(user.getLoginAttempts()).isZero();
    }

    @Test
    void unknownIdentifier_throwsGenericInvalidCredentialsWithoutIncrement() {
        when(userAccountRepository.findByEmailOrMmuId("ghost@mmu.edu.my"))
                .thenReturn(Optional.empty());
        LoginRequest r = new LoginRequest();
        r.setIdentifier("ghost@mmu.edu.my");
        r.setPassword("anything");

        assertThatThrownBy(() -> service.login(r))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid credentials.");
        // No counter to increment because user wasn't found — verifies we don't leak
        // existence by treating known/unknown identifiers differently.
    }
}
