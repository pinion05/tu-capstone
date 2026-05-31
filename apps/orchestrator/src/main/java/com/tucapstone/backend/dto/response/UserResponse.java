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
}