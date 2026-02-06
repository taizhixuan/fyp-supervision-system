package com.fyp.supervision.dto.auth;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String email;
    private String phone;
}
