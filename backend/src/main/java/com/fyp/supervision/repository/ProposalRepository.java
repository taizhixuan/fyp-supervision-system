package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.enums.ProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    Optional<Proposal> findByStudent_UserId(Long studentUserId);
    List<Proposal> findBySupervisor_UserId(Long supervisorUserId);
    Page<Proposal> findByStatus(ProposalStatus status, Pageable pageable);
    long countByStatus(ProposalStatus status);
}
