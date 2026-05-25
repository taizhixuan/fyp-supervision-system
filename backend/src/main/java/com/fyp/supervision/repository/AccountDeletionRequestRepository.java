package com.fyp.supervision.repository;

import com.fyp.supervision.entity.AccountDeletionRequest;
import com.fyp.supervision.enums.DeletionRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountDeletionRequestRepository extends JpaRepository<AccountDeletionRequest, Long> {
    Optional<AccountDeletionRequest> findFirstByUser_UserIdAndStatusOrderByRequestedAtDesc(Long userId, DeletionRequestStatus status);
    Optional<AccountDeletionRequest> findFirstByUser_UserIdOrderByRequestedAtDesc(Long userId);
    List<AccountDeletionRequest> findByStatusOrderByRequestedAtDesc(DeletionRequestStatus status);
    List<AccountDeletionRequest> findAllByOrderByRequestedAtDesc();
}
