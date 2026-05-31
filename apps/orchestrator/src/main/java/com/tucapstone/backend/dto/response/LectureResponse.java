package com.tucapstone.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureResponse {
    private Long id;
    private Long userId;
    private String title;
    private LocalDateTime createdAt;
}