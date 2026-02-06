package com.fyp.supervision.repository;

import com.fyp.supervision.entity.UserNotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserNotificationPreferencesRepository extends JpaRepository<UserNotificationPreferences, Long> {
}
