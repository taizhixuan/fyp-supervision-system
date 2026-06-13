package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeadlineRepository extends JpaRepository<Deadline, Long> {
    List<Deadline> findByCycle_CycleIdOrderByDueDateAsc(Long cycleId);
    List<Deadline> findByDueDateAfterOrderByDueDateAsc(LocalDate date);
    List<Deadline> findByAudienceAndDueDateAfterOrderByDueDateAsc(String audience, LocalDate date);
    List<Deadline> findByCycle_CycleTypeAndDueDateAfterOrderByDueDateAsc(String cycleType, LocalDate date);
    List<Deadline> findByCycle_CycleTypeAndAudienceAndDueDateAfterOrderByDueDateAsc(String cycleType, String audience, LocalDate date);
    List<Deadline> findByCycle_CycleIdAndAudienceAndDueDateAfterOrderByDueDateAsc(Long cycleId, String audience, LocalDate date);
    List<Deadline> findByCycle_CycleIdAndDueDateAfterOrderByDueDateAsc(Long cycleId, LocalDate date);

    /**
     * Upcoming deadlines for the reminder job. Selects on the EFFECTIVE due date
     * (extendedDate when set, else dueDate) so a deadline extended past its original
     * date is still picked up, and JOIN FETCHes the cycle so the scheduled thread —
     * which has no open session — can read cycle.cycleType without a LazyInitializationException.
     */
    @Query("select d from Deadline d left join fetch d.cycle " +
           "where d.dueDate >= :date or (d.extendedDate is not null and d.extendedDate >= :date) " +
           "order by d.dueDate asc")
    List<Deadline> findUpcomingByEffectiveDate(@Param("date") LocalDate date);

    @Modifying
    @Query("delete from Deadline d where d.cycle.cycleId = :cycleId")
    int deleteAllByCycleId(@Param("cycleId") Long cycleId);
}
