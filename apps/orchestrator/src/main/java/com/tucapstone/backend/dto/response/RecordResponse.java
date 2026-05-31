package com.tucapstone.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordResponse {
    private Long id;
    private Long lectureId;
    private String s3AudioPath;
    private String s3TranscriptPath;
    private String s3VectorPath;
    private Integer duration;
    private LocalDateTime createdAt;

    public void updateFromPython(String s3AudioPath, String s3TranscriptPath, String s3VectorPath, Integer duration) {
        this.s3AudioPath = s3AudioPath;
        this.s3TranscriptPath = s3TranscriptPath;
        this.s3VectorPath = s3VectorPath;
        this.duration = duration;
    }
}