package com.fyp.supervision.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String identifier;

    @NotBlank
    private String password;

    private Boolean rememberMe;
}
