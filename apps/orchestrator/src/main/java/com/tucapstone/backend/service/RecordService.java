package com.tucapstone.backend.service;

import com.tucapstone.backend.dto.request.RecordCompleteRequest;
import com.tucapstone.backend.entity.Lecture;
import com.tucapstone.backend.entity.Record;
import com.tucapstone.backend.repository.LectureRepository;
import com.tucapstone.backend.repository.RecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final RecordRepository recordRepository;
    private final LectureRepository lectureRepository;

    @Transactional
    public void completeRecord(RecordCompleteRequest request) {
        // 1. 해당 강의가 존재하는지 확인
        Lecture lecture = lectureRepository.findById(request.getLectureId())
                .orElseThrow(() -> new RuntimeException("Lecture not found with ID: " + request.getLectureId()));

        // 2. 기존 Record가 있으면 업데이트, 없으면 신규 생성
        Record record = recordRepository.findByLectureId(lecture.getId())
                .orElse(Record.builder()
                        .lecture(lecture)
                        .build());

        // 3. Python 서버에서 받은 S3 정보 및 녹음 시간 업데이트
        record.setS3AudioPath(request.getS3AudioPath());
        record.setS3TranscriptPath(request.getS3TranscriptPath());
        record.setS3VectorPath(request.getS3VectorPath());
        record.setDuration(request.getDuration());

        recordRepository.save(record);
    }
}