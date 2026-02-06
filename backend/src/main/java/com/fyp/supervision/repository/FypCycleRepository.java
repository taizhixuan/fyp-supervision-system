package com.fyp.supervision.repository;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FypCycleRepository extends JpaRepository<FypCycle, Long> {
    Optional<FypCycle> findByStatus(CycleStatus status);
    List<FypCycle> findAllByOrderByStartDateDesc();
    boolean existsByCycleCode(String cycleCode);
}
