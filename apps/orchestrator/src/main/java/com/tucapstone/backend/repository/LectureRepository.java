package com.tucapstone.backend.repository;

import com.tucapstone.backend.entity.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findByUserIdOrderByCreatedAtDesc(Long userId);
}