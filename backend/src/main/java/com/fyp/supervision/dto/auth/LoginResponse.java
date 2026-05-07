package com.fyp.supervision.dto.auth;

import com.fyp.supervision.dto.common.UserDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private UserDto user;
    /** "FYP1" | "FYP2" — only set for STUDENT role with a project. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String currentPhase;
    /** TRUE/FALSE/NULL — only set for STUDENT role with a project. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean fyp1Passed;

    public LoginResponse(String accessToken, UserDto user) {
        this(accessToken, user, null, null);
    }
}
