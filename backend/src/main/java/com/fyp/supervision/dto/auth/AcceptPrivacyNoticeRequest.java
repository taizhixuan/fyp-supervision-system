package com.fyp.supervision.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AcceptPrivacyNoticeRequest {
    @NotBlank(message = "Privacy notice version is required")
    private String version;
}
