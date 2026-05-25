package com.fyp.supervision.repository;

import com.fyp.supervision.entity.SupervisorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;

public interface SupervisorAvailabilityRepository
        extends JpaRepository<SupervisorAvailability, Long> {

    List<SupervisorAvailability> findBySupervisor_UserIdOrderByDayOfWeekAscStartTimeAsc(Long supervisorUserId);

    List<SupervisorAvailability> findBySupervisor_UserIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long supervisorUserId);

    List<SupervisorAvailability> findBySupervisor_UserIdAndDayOfWeekAndIsActiveTrue(Long supervisorUserId, DayOfWeek dayOfWeek);

    void deleteBySupervisor_UserId(Long supervisorUserId);
}
