package com.tucapstone.backend.controller;

import com.tucapstone.backend.dto.request.RecordCompleteRequest;
import com.tucapstone.backend.service.RecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Internal API", description = "Python AI 서버 연동용 내부 API")
@RestController
@RequestMapping("/api/internal/records")
@RequiredArgsConstructor
public class InternalRecordController {

    private final RecordService recordService;

    @Operation(summary = "녹음 완료 콜백", description = "Python AI 서버가 S3 업로드 완료 후 정보를 전달합니다.")
    @PostMapping("/complete")
    public ResponseEntity<Void> completeRecord(@RequestBody @Valid RecordCompleteRequest request) {
        recordService.completeRecord(request);
        return ResponseEntity.ok().build();
    }
}