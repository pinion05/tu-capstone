package com.tucapstone.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    private Long id;
    private Long recordId;
    private String content;
    private Boolean isAgent;
    private LocalDateTime createdAt;
}