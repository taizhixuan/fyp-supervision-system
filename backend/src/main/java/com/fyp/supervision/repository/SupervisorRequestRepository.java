package com.fyp.supervision.repository;

import com.fyp.supervision.entity.SupervisorRequest;
import com.fyp.supervision.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupervisorRequestRepository extends JpaRepository<SupervisorRequest, Long> {
    List<SupervisorRequest> findByStudent_UserIdOrderBySubmittedAtDesc(Long studentUserId);
    List<SupervisorRequest> findBySupervisorUser_UserIdOrderBySubmittedAtDesc(Long supervisorUserId);
    List<SupervisorRequest> findBySupervisorUser_UserIdAndStatusOrderBySubmittedAtDesc(Long supervisorUserId, RequestStatus status);
    long countBySupervisorUser_UserIdAndStatus(Long supervisorUserId, RequestStatus status);
    boolean existsByStudent_UserIdAndSupervisorUser_UserIdAndStatus(Long studentUserId, Long supervisorUserId, RequestStatus status);
}
