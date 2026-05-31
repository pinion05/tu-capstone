package com.tucapstone.backend.config;

import com.tucapstone.backend.dto.response.PrincipalUser;
import com.tucapstone.backend.dto.response.TokenResponse;
import com.tucapstone.backend.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.frontend.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) 
            throws IOException, ServletException {
        
        PrincipalUser principalUser = (PrincipalUser) authentication.getPrincipal();

        // 서비스 로직을 통해 토큰 발급
        TokenResponse tokenResponse = authService.login(principalUser.getUser());

        // 프론트엔드로 리다이렉트 (토큰을 URL 파라미터로 전달)
        String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("accessToken", tokenResponse.getAccessToken())
                .queryParam("refreshToken", tokenResponse.getRefreshToken())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
