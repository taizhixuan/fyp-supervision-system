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
    boolean existsByStudent_UserIdAndStatus(Long studentUserId, RequestStatus status);
    long countByStudent_UserIdAndStatus(Long studentUserId, RequestStatus status);
    List<SupervisorRequest> findByStudent_UserIdAndStatus(Long studentUserId, RequestStatus status);
    List<SupervisorRequest> findTop5ByStatusOrderByRespondedAtDesc(RequestStatus status);
    /** Fetch-joins both users: the expiry job runs outside a transaction and reads their names. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT r FROM SupervisorRequest r JOIN FETCH r.student JOIN FETCH r.supervisorUser "
            + "WHERE r.status = :status AND r.expiresAt < :cutoff")
    List<SupervisorRequest> findByStatusAndExpiresAtBefore(
            @org.springframework.data.repository.query.Param("status") RequestStatus status,
            @org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff);

    @org.springframework.data.jpa.repository.Query(
        "select max(r.submittedAt) from SupervisorRequest r where r.student.userId = :studentUserId")
    java.util.Optional<java.time.LocalDateTime> findMaxSubmittedAtByStudent_UserId(
        @org.springframework.data.repository.query.Param("studentUserId") Long studentUserId);
}
