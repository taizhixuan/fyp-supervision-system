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
    @Pattern(regexp = "^\\d{10}$", message = "MMU ID must be exactly 10 digits")
    private String mmuId;

    @NotBlank
    @Email
    private String email;

    private String phone;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;
}
