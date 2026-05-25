package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ChatPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatPreferencesRepository extends JpaRepository<ChatPreferences, Long> {
}
