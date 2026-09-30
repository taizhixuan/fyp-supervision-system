package com.fyp.supervision.repository;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.enums.MeetingLogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingLogRepository extends JpaRepository<MeetingLog, Long> {

    /** [studentUserId, fypPhase, count] of LOCKED logs, for batch progress/risk scoring. */
    @Query("SELECT l.student.userId, l.fypPhase, COUNT(l) FROM MeetingLog l "
            + "WHERE l.status = com.fyp.supervision.enums.MeetingLogStatus.LOCKED AND l.student.userId IN :studentIds "
            + "GROUP BY l.student.userId, l.fypPhase")
    List<Object[]> countLockedByStudentAndPhase(@Param("studentIds") java.util.Collection<Long> studentIds);

    Page<MeetingLog> findByStudent_UserIdOrderByCreatedAtDesc(Long studentUserId, Pageable pageable);
    Page<MeetingLog> findByStudent_UserIdAndStatusOrderByCreatedAtDesc(Long studentUserId, MeetingLogStatus status, Pageable pageable);
    List<MeetingLog> findByStudent_UserIdAndStatusOrderByCreatedAtDesc(Long studentUserId, MeetingLogStatus status);
    List<MeetingLog> findBySupervisor_UserIdOrderByCreatedAtDesc(Long supervisorUserId);
    List<MeetingLog> findBySupervisor_UserIdAndStatusOrderByCreatedAtDesc(Long supervisorUserId, MeetingLogStatus status);
    long countByStudent_UserId(Long studentUserId);
    long countByStudent_UserIdAndStatus(Long studentUserId, MeetingLogStatus status);
    long countByStudent_UserIdAndFypPhase(Long studentUserId, String fypPhase);
    java.util.Optional<MeetingLog> findFirstByStudent_UserIdOrderByCreatedAtDesc(Long studentUserId);
    java.util.Optional<MeetingLog> findFirstByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc(Long studentUserId, String fypPhase);
    Page<MeetingLog> findByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc(Long studentUserId, String fypPhase, Pageable pageable);
    Page<MeetingLog> findByStudent_UserIdAndStatusAndFypPhaseOrderByCreatedAtDesc(Long studentUserId, MeetingLogStatus status, String fypPhase, Pageable pageable);
    List<MeetingLog> findBySupervisor_UserIdAndFypPhaseOrderByCreatedAtDesc(Long supervisorUserId, String fypPhase);
    List<MeetingLog> findBySupervisor_UserIdAndStatusAndFypPhaseOrderByCreatedAtDesc(Long supervisorUserId, MeetingLogStatus status, String fypPhase);
    long countBySupervisor_UserIdAndStatus(Long supervisorUserId, MeetingLogStatus status);
    long countByStudent_UserIdAndStatusAndFypPhase(Long studentUserId, MeetingLogStatus status, String fypPhase);
    long countBySupervisor_UserIdAndStudent_UserId(Long supervisorUserId, Long studentUserId);
    long countBySupervisor_UserIdAndStudent_UserIdAndStatus(Long supervisorUserId, Long studentUserId, MeetingLogStatus status);
    List<MeetingLog> findByStatusAndContentHashIsNull(MeetingLogStatus status);

    java.util.Optional<com.fyp.supervision.entity.MeetingLog> findFirstByMeeting_MeetingIdOrderByLogIdAsc(Long meetingId);

    boolean existsByMeeting_MeetingId(Long meetingId);
}
