package com.fyp.supervision.dto.auth;

import com.fyp.supervision.dto.common.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private UserDto user;
}
