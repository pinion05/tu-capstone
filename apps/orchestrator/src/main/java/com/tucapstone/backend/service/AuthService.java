package com.tucapstone.backend.service;

import com.tucapstone.backend.config.JwtTokenProvider;
import com.tucapstone.backend.dto.response.TokenResponse;
import com.tucapstone.backend.dto.response.UserResponse;
import com.tucapstone.backend.entity.RefreshToken;
import com.tucapstone.backend.entity.User;
import com.tucapstone.backend.repository.RefreshTokenRepository;
import com.tucapstone.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Transactional
    public TokenResponse login(String email) {
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .name("Temp User")
                            .role("ROLE_USER")
                            .build();
                    return userRepository.save(newUser);
                });

        return createTokens(user);
    }

    @Transactional
    public TokenResponse login(UserResponse user) {
        // DB 조회를 생략하고 ID만 가진 프록시 객체 생성 (성능 최적화)
        User entity = userRepository.getReferenceById(user.getId());
        return createTokens(entity, user.getEmail(), user.getRole());
    }

    private TokenResponse createTokens(User user) {
        return createTokens(user, user.getEmail(), user.getRole());
    }

    private TokenResponse createTokens(User user, String email, String role) {
        String accessToken = jwtTokenProvider.createAccessToken(email, role);
        String refreshTokenString = jwtTokenProvider.createRefreshToken(email);

        // 방금 만든 토큰으로 찾는 것이 아니라, 유저 ID로 기존 토큰을 찾아 업데이트
        RefreshToken refreshToken = refreshTokenRepository.findByUserId(user.getId())
                .orElse(RefreshToken.builder().user(user).build());

        refreshToken.setToken(refreshTokenString);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000));

        refreshTokenRepository.save(refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenString)
                .tokenType("Bearer")
                .build();
    }

    @Transactional(noRollbackFor = com.tucapstone.backend.exception.TokenExpiredException.class)
    public TokenResponse refresh(String refreshTokenString) {
        if (!jwtTokenProvider.validateToken(refreshTokenString)) {
            throw new RuntimeException("Invalid Refresh Token");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> new RuntimeException("Refresh Token not found in DB"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new com.tucapstone.backend.exception.TokenExpiredException("Refresh Token expired");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole());
        String newRefreshTokenString = jwtTokenProvider.createRefreshToken(user.getEmail());

        refreshToken.setToken(newRefreshTokenString);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000));
        refreshTokenRepository.save(refreshToken);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenString)
                .tokenType("Bearer")
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getMyInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .picture(user.getPicture())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        refreshTokenRepository.deleteByUserId(user.getId());
    }
}