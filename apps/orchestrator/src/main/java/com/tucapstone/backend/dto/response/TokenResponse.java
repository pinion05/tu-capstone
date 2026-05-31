package com.tucapstone.backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "인증 토큰 응답")
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
}