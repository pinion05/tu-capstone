package com.tucapstone.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String picture;
    private String provider;
    private String providerId;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void updateOAuthInfo(String name, String picture, String provider, String providerId) {
        this.name = name;
        this.picture = picture;
        this.provider = provider;
        this.providerId = providerId;
        this.updatedAt = LocalDateTime.now();
    }
}