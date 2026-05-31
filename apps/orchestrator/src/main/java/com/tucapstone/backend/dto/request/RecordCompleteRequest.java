package com.tucapstone.backend.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Getter
@NoArgsConstructor
@Schema(description = "녹음 완료 콜백 요청")
public class RecordCompleteRequest {
    @NotNull
    private Long lectureId;
    private String s3AudioPath;
    private String s3TranscriptPath;
    private String s3VectorPath;
    private Integer duration;
}