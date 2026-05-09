package com.fyp.supervision.dto.common;

import com.fyp.supervision.entity.UserAccount;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long userId;
    private String mmuId;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private String status;
    private String profileImagePath;
    private String lastLoginAt;
    private String createdAt;
    private String updatedAt;

    public static UserDto fromEntity(UserAccount user) {
        return UserDto.builder()
                .userId(user.getUserId())
                .mmuId(user.getMmuId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .profileImagePath(user.getProfileImagePath())
                .lastLoginAt(user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null)
                .createdAt(user.getCreatedAt().toString())
                .updatedAt(user.getUpdatedAt().toString())
                .build();
    }
}
