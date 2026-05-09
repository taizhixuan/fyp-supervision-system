package com.fyp.supervision.repository;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FypCycleRepository extends JpaRepository<FypCycle, Long> {

    /**
     * Returns the first matching cycle, in case multiple share a status.
     * The {@code findByStatus} variant of derived query throws when more than one row exists,
     * so prefer this when looking for the active one.
     */
    Optional<FypCycle> findFirstByStatusOrderByStartDateDesc(CycleStatus status);

    Optional<FypCycle> findFirstByCycleTypeAndStatusOrderByStartDateDesc(String cycleType, CycleStatus status);

    List<FypCycle> findByStatus(CycleStatus status);

    List<FypCycle> findByCycleType(String cycleType);

    List<FypCycle> findAllByOrderByStartDateDesc();

    boolean existsByCycleCode(String cycleCode);

    /**
     * Direct UPDATE — bypasses entity load/dirty-checking/flush. Use for simple status flips
     * to avoid commit-time failures from unrelated managed entities in the same session.
     */
    @Modifying
    @Query("update FypCycle c set c.status = :status, c.updatedAt = CURRENT_TIMESTAMP where c.cycleId = :id")
    int updateStatusById(@Param("id") Long id, @Param("status") CycleStatus status);

    @Modifying
    @Query("update FypCycle c set c.status = :status, c.updatedAt = CURRENT_TIMESTAMP " +
            "where c.cycleType = :type and c.status = :currentStatus and c.cycleId <> :exceptId")
    int reassignStatusForType(@Param("type") String cycleType,
                              @Param("currentStatus") CycleStatus currentStatus,
                              @Param("status") CycleStatus newStatus,
                              @Param("exceptId") Long exceptId);

    @Modifying
    @Query("delete from FypCycle c where c.cycleId = :id")
    int deleteByIdDirect(@Param("id") Long id);
}
