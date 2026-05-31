package com.tucapstone.backend.repository;

import com.tucapstone.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRecordIdOrderByCreatedAtAsc(Long recordId);
}