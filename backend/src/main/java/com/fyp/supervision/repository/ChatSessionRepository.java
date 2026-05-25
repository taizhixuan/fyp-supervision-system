package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(Long userId);

    List<ChatSession> findByUser_UserIdOrderByStartedAtDesc(Long userId);
}
