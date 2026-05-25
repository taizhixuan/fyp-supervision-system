package com.fyp.supervision.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String role;

    @NotBlank
    @Size(max = 200)
    private String fullName;

    @NotBlank
    @Pattern(
            regexp = "^(\\d{10}|\\d{3}[A-Za-z]{2}\\d{4}[A-Za-z])$",
            message = "MMU ID must be 10 digits or in MMU format (e.g. 123AB4567C)"
    )
    private String mmuId;

    @NotBlank
    @Email
    @Pattern(
            regexp = "^[A-Za-z0-9._%+-]+@(student\\.mmu\\.edu\\.my|mmu\\.edu\\.my)$",
            message = "Email must end with @student.mmu.edu.my or @mmu.edu.my"
    )
    private String email;

    private String phone;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    /** Student-only. One of: Software Engineering, Data Science, Cybersecurity, Game Development, Information Systems. */
    @Size(max = 200)
    private String specialisation;

    /** Student-only. The 4-digit calendar year the student joined the programme. */
    private Integer intakeYear;

    /** Must be true — proves the user ticked the consent checkbox before submitting. */
    @AssertTrue(message = "You must accept the Privacy Notice to register")
    private boolean acceptedPrivacyNotice;

    /** Version string of the privacy notice the user agreed to. Persisted for audit. */
    private String privacyNoticeVersion;
}
