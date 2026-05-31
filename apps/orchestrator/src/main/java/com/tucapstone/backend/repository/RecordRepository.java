package com.tucapstone.backend.repository;

import com.tucapstone.backend.entity.Record;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecordRepository extends JpaRepository<Record, Long> {
    Optional<Record> findByLectureId(Long lectureId);
}