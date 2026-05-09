package com.fyp.supervision.repository;

import com.fyp.supervision.entity.DeadlineReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DeadlineReminderLogRepository
        extends JpaRepository<DeadlineReminderLog, DeadlineReminderLog.PK> {

    // Method-name derivation parses `DaysBefore` as `Days` + `Before` keyword,
    // so use an explicit query bound to the actual field name.
    @Query("SELECT COUNT(l) > 0 FROM DeadlineReminderLog l " +
           "WHERE l.deadlineId = :deadlineId AND l.daysBefore = :daysBefore")
    boolean existsByDeadlineIdAndDaysBefore(@Param("deadlineId") Long deadlineId,
                                            @Param("daysBefore") Integer daysBefore);
}
