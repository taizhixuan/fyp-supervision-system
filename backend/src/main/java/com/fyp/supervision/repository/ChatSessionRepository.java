package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(Long userId);

    List<ChatSession> findByUser_UserIdOrderByStartedAtDesc(Long userId);

    /** Sessions that ended before the cutoff. Returned (not deleted in-query) so cascade
     *  to messages happens through JPA orphan removal. */
    List<ChatSession> findByEndedAtNotNullAndEndedAtBefore(LocalDateTime cutoff);
}
