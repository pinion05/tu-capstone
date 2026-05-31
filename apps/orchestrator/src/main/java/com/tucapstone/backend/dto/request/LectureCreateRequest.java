package com.tucapstone.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "강의 생성 요청")
public class LectureCreateRequest {
    @NotBlank
    @Schema(description = "강의 제목", example = "운영체제 1강")
    private String title;
}