package com.tucapstone.backend.controller;

import com.tucapstone.backend.dto.response.TokenResponse;
import com.tucapstone.backend.dto.response.UserResponse;
import com.tucapstone.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "인증 관련 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "내 정보 조회", description = "현재 로그인한 사용자의 정보를 조회합니다. (인증 검증용)")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getMyInfo(userDetails.getUsername()));
    }

    @Operation(summary = "로그아웃", description = "현재 사용자의 세션(Refresh Token)을 종료합니다.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());

        org.springframework.http.ResponseCookie accessCookie = org.springframework.http.ResponseCookie.from("accessToken", "")
                .path("/")
                .maxAge(0)
                .build();

        org.springframework.http.ResponseCookie refreshCookie = org.springframework.http.ResponseCookie.from("refreshToken", "")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .build();
    }

    @Operation(summary = "로그인 (임시)", description = "테스트용 로그인을 수행하고 토큰을 발급합니다.")
    @PostMapping("/login/temp")
    public ResponseEntity<TokenResponse> tempLogin(@RequestParam String email) {
        return ResponseEntity.ok(authService.login(email));
    }

    @Operation(summary = "토큰 갱신", description = "Refresh Token을 사용하여 Access Token을 재발급합니다.")
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(value = "refreshToken", required = false) String cookieRefreshToken,
            @RequestParam(required = false) String refreshToken) {
            
        String token = cookieRefreshToken != null ? cookieRefreshToken : refreshToken;
        if (token == null) {
            return ResponseEntity.status(401).build();
        }
        
        TokenResponse tokenResponse = authService.refresh(token);
        
        org.springframework.http.ResponseCookie accessCookie = org.springframework.http.ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
                .path("/")
                .httpOnly(true)
                .secure(false) // Change to true in production
                .sameSite("Lax")
                .maxAge(3600)
                .build();

        org.springframework.http.ResponseCookie refreshCookie = org.springframework.http.ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .path("/")
                .httpOnly(true)
                .secure(false) // Change to true in production
                .sameSite("Lax")
                .maxAge(604800)
                .build();
        
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokenResponse);
    }
}