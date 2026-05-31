package com.tucapstone.backend.controller;

import com.tucapstone.backend.dto.request.LectureCreateRequest;
import com.tucapstone.backend.dto.response.LectureResponse;
import com.tucapstone.backend.service.LectureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Lecture", description = "강의 기록 관리 API")
@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
public class LectureController {

    private final LectureService lectureService;

    @Operation(summary = "내 강의 목록 조회", description = "현재 로그인한 사용자의 전체 강의 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<List<LectureResponse>> getMyLectures(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(lectureService.getMyLectures(userDetails.getUsername()));
    }

    @Operation(summary = "강의 생성", description = "새로운 강의 기록을 생성합니다.")
    @PostMapping
    public ResponseEntity<LectureResponse> createLecture(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid LectureCreateRequest request) {
        return ResponseEntity.ok(lectureService.createLecture(userDetails.getUsername(), request));
    }

    @Operation(summary = "강의 상세 조회", description = "특정 강의의 상세 정보와 S3 경로를 조회합니다.")
    @GetMapping("/{lectureId}")
    public ResponseEntity<?> getLectureDetail(@PathVariable Long lectureId) {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "강의 삭제", description = "강의 기록을 삭제합니다.")
    @DeleteMapping("/{lectureId}")
    public ResponseEntity<Void> deleteLecture(@PathVariable Long lectureId) {
        return ResponseEntity.ok().build();
    }
}