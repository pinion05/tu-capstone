package com.tucapstone.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenResponse {
    private Long id;
    private Long userId;
    private String token;
    private String userAgent;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    public void updateToken(String newToken, LocalDateTime newExpiresAt) {
        this.token = newToken;
        this.expiresAt = newExpiresAt;
    }
}