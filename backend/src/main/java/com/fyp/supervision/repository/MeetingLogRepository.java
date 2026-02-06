package com.fyp.supervision.repository;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.enums.MeetingLogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingLogRepository extends JpaRepository<MeetingLog, Long> {
    Page<MeetingLog> findByStudent_UserIdOrderByCreatedAtDesc(Long studentUserId, Pageable pageable);
    Page<MeetingLog> findByStudent_UserIdAndStatusOrderByCreatedAtDesc(Long studentUserId, MeetingLogStatus status, Pageable pageable);
    List<MeetingLog> findByStudent_UserIdAndStatusOrderByCreatedAtDesc(Long studentUserId, MeetingLogStatus status);
    List<MeetingLog> findBySupervisor_UserIdOrderByCreatedAtDesc(Long supervisorUserId);
    List<MeetingLog> findBySupervisor_UserIdAndStatusOrderByCreatedAtDesc(Long supervisorUserId, MeetingLogStatus status);
    long countByStudent_UserIdAndStatus(Long studentUserId, MeetingLogStatus status);
    long countBySupervisor_UserIdAndStatus(Long supervisorUserId, MeetingLogStatus status);
}
