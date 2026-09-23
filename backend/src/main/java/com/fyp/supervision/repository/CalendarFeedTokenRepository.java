package com.fyp.supervision.repository;

import com.fyp.supervision.entity.CalendarFeedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CalendarFeedTokenRepository extends JpaRepository<CalendarFeedToken, Long> {
    Optional<CalendarFeedToken> findByTokenHash(String tokenHash);
}
