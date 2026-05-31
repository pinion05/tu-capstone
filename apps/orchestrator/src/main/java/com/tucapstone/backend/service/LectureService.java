package com.tucapstone.backend.service;

import com.tucapstone.backend.dto.request.LectureCreateRequest;
import com.tucapstone.backend.dto.response.LectureResponse;
import com.tucapstone.backend.entity.Lecture;
import com.tucapstone.backend.entity.User;
import com.tucapstone.backend.repository.LectureRepository;
import com.tucapstone.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LectureService {

    private final LectureRepository lectureRepository;
    private final UserRepository userRepository;

    @Transactional
    public LectureResponse createLecture(String email, LectureCreateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Lecture lecture = Lecture.builder()
                .user(user)
                .title(request.getTitle())
                .build();

        Lecture savedLecture = lectureRepository.save(lecture);
        
        return LectureResponse.builder()
                .id(savedLecture.getId())
                .userId(savedLecture.getUser().getId())
                .title(savedLecture.getTitle())
                .createdAt(savedLecture.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<LectureResponse> getMyLectures(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Lecture> lectures = lectureRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        return lectures.stream().map(l -> LectureResponse.builder()
                .id(l.getId())
                .userId(l.getUser().getId())
                .title(l.getTitle())
                .createdAt(l.getCreatedAt())
                .build()).collect(Collectors.toList());
    }
}