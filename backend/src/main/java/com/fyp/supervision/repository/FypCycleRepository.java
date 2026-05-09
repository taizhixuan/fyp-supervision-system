package com.fyp.supervision.repository;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
