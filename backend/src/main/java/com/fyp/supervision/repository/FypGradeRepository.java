package com.fyp.supervision.repository;

import com.fyp.supervision.entity.FypGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FypGradeRepository extends JpaRepository<FypGrade, Long> {

    /** Look up the grade row a specific grader has on a project for a phase. */
    Optional<FypGrade> findByProject_ProjectIdAndPhaseAndGrader_UserId(
            Long projectId, String phase, Long graderUserId);

    /** All grade rows for a project (any phase, any grader). */
    List<FypGrade> findByProject_ProjectIdOrderByCreatedAtDesc(Long projectId);

    /** All grade rows a specific grader has authored — supervisor's grading queue. */
    List<FypGrade> findByGrader_UserIdOrderByUpdatedAtDesc(Long graderUserId);

    /** Finalised grades visible to the student. */
    List<FypGrade> findByProject_ProjectIdAndStatusOrderByPhaseAscCreatedAtAsc(
            Long projectId, String status);

    /** Used by admin's global "submitted grades" inbox. */
    List<FypGrade> findByStatusOrderByUpdatedAtDesc(String status);
}
