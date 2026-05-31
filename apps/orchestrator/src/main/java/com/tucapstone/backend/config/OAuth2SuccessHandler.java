package com.tucapstone.backend.config;

import com.tucapstone.backend.security.PrincipalUser;
import com.tucapstone.backend.dto.response.TokenResponse;
import com.tucapstone.backend.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.frontend.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) 
            throws IOException, ServletException {
        
        PrincipalUser principalUser = (PrincipalUser) authentication.getPrincipal();

        // 서비스 로직을 통해 토큰 발급
        TokenResponse tokenResponse = authService.login(principalUser.getUser());

        ResponseCookie accessCookie = ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
                .path("/")
                .httpOnly(true)
                .secure(false) // Change to true in production
                .sameSite("Lax")
                .maxAge(jwtTokenProvider.getAccessTokenExpiration() / 1000)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .path("/")
                .httpOnly(true)
                .secure(false) // Change to true in production
                .sameSite("Lax")
                .maxAge(jwtTokenProvider.getRefreshTokenExpiration() / 1000)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        getRedirectStrategy().sendRedirect(request, response, frontendRedirectUri);
    }
}
