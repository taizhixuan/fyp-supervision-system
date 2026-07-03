package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.enums.MeetingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    @Query("SELECT m FROM Meeting m WHERE m.project.student.userId = :userId ORDER BY m.proposedStartAt DESC")
    Page<Meeting> findByStudentUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT m FROM Meeting m WHERE m.project.student.userId = :userId ORDER BY m.proposedStartAt DESC")
    List<Meeting> findAllByStudentUserId(@Param("userId") Long userId);

    @Query("SELECT m FROM Meeting m WHERE m.project.supervisor.userId = :userId ORDER BY m.proposedStartAt DESC")
    List<Meeting> findBySupervisorUserId(@Param("userId") Long userId);

    @Query("SELECT m FROM Meeting m WHERE m.project.student.userId = :userId AND m.status = :status")
    Page<Meeting> findByStudentUserIdAndStatus(@Param("userId") Long userId, @Param("status") MeetingStatus status, Pageable pageable);

    @Query("SELECT m FROM Meeting m WHERE m.project.student.userId = :userId AND m.proposedStartAt BETWEEN :from AND :to")
    Page<Meeting> findByStudentUserIdAndDateRange(@Param("userId") Long userId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    long countByProject_Student_UserId(Long studentUserId);

    @Query("SELECT m FROM Meeting m WHERE m.project.supervisor.userId = :userId AND m.status = :status ORDER BY m.proposedStartAt DESC")
    List<Meeting> findBySupervisorUserIdAndStatus(@Param("userId") Long userId, @Param("status") MeetingStatus status);

    @Query("SELECT COUNT(m) FROM Meeting m WHERE m.project.supervisor.userId = :userId AND m.status IN :statuses")
    long countBySupervisorUserIdAndStatusIn(@Param("userId") Long userId, @Param("statuses") List<MeetingStatus> statuses);

    long countByProject_ProjectIdAndStatus(Long projectId, com.fyp.supervision.enums.MeetingStatus status);

    List<Meeting> findTop5ByProject_ProjectIdOrderByConfirmedStartAtDesc(Long projectId);

    @Query("select max(m.confirmedStartAt) from Meeting m " +
           "where m.project.projectId = :projectId and m.status = :status")
    java.util.Optional<java.time.LocalDateTime> findMaxConfirmedStartAtByProjectAndStatus(
            @org.springframework.data.repository.query.Param("projectId") Long projectId,
            @org.springframework.data.repository.query.Param("status") com.fyp.supervision.enums.MeetingStatus status);

    @Query("select m from Meeting m where m.project.projectId = :projectId " +
           "and m.status in :statuses " +
           "and coalesce(m.confirmedStartAt, m.proposedStartAt) >= :from " +
           "order by coalesce(m.confirmedStartAt, m.proposedStartAt) asc")
    List<Meeting> findUpcomingByProjectAndStatusIn(
            @Param("projectId") Long projectId,
            @Param("statuses") List<MeetingStatus> statuses,
            @Param("from") LocalDateTime from);

    /** Used by availability slot expansion to mask taken slots. */
    @Query("select m from Meeting m " +
           "where m.project.supervisor.userId = :userId " +
           "and m.status in :statuses " +
           "and coalesce(m.confirmedStartAt, m.proposedStartAt) >= :from " +
           "and coalesce(m.confirmedStartAt, m.proposedStartAt) < :to")
    List<Meeting> findBlockingMeetingsForSupervisor(
            @Param("userId") Long supervisorUserId,
            @Param("statuses") List<MeetingStatus> statuses,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /** Confirmed meetings starting within the reminder window that have not been reminded yet.
     *  Project/student/supervisor are fetch-joined so the scheduled thread (no open session)
     *  can read them without a LazyInitializationException. */
    @Query("select m from Meeting m " +
           "join fetch m.project p " +
           "join fetch p.student " +
           "left join fetch p.supervisor " +
           "where m.status = :status " +
           "and m.confirmedStartAt is not null " +
           "and m.confirmedStartAt between :from and :to " +
           "and m.reminderSentAt is null")
    List<Meeting> findDueForReminder(@Param("status") MeetingStatus status,
                                     @Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);
}
