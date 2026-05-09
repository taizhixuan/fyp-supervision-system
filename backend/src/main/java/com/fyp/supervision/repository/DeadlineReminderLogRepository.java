package com.fyp.supervision.repository;

import com.fyp.supervision.entity.DeadlineReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeadlineReminderLogRepository
        extends JpaRepository<DeadlineReminderLog, DeadlineReminderLog.PK> {

    boolean existsByDeadlineIdAndDaysBefore(Long deadlineId, Integer daysBefore);
}
