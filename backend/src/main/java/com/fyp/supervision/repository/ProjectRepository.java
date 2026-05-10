package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByStudent_UserId(Long studentUserId);
    List<Project> findBySupervisor_UserId(Long supervisorUserId);
    Page<Project> findByCycle_CycleId(Long cycleId, Pageable pageable);
    long countByCycle_CycleId(Long cycleId);
    long countBySupervisor_UserId(Long supervisorUserId);
    long countBySupervisor_UserIdAndStatus(Long supervisorUserId, ProjectStatus status);
    long countByStatus(ProjectStatus status);

    @Query("SELECT p FROM Project p WHERE p.cycle.cycleId = :cycleId AND p.student IS NOT NULL AND p.supervisor IS NULL")
    List<Project> findUnpairedStudentsByCycle(@Param("cycleId") Long cycleId);

    @Query("SELECT p FROM Project p WHERE p.cycle.cycleId = :cycleId")
    Page<Project> findAllByCycleId(@Param("cycleId") Long cycleId, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE (p.stage IS NULL OR p.stage = 'FYP1' OR p.stage = 'FYP 1') AND p.student IS NOT NULL ORDER BY p.updatedAt DESC")
    List<Project> findFyp1Projects();

    @Query("SELECT COUNT(p) FROM Project p WHERE (p.stage IS NULL OR p.stage = 'FYP1' OR p.stage = 'FYP 1') AND p.student IS NOT NULL")
    long countFyp1Projects();

    @Query("SELECT COUNT(p) FROM Project p WHERE (p.stage = 'FYP2' OR p.stage = 'FYP 2') AND p.student IS NOT NULL")
    long countFyp2Projects();

    @Query("SELECT COUNT(p) FROM Project p WHERE p.student IS NOT NULL AND p.supervisor IS NULL")
    long countUnpairedStudents();

    /**
     * Projects whose enrolled cycle is currently ACTIVE — used by supervisor/committee
     * lists so they don't surface students from cycles that have been COMPLETED/ARCHIVED.
     */
    @Query("SELECT p FROM Project p WHERE p.supervisor.userId = :supervisorId AND p.cycle.status = com.fyp.supervision.enums.CycleStatus.ACTIVE")
    List<Project> findActiveCycleBySupervisor(@Param("supervisorId") Long supervisorId);
}
