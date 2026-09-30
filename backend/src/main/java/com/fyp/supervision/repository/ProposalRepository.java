package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.enums.ProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {

    /**
     * The committee queue, filtered in the database so paging and the total are correct:
     * supervisor-approved proposals (UNDER_REVIEW / APPROVED), plus REJECTED /
     * REVISION_REQUIRED ones only when the committee itself reviewed them.
     */
    @Query("SELECT p FROM Proposal p WHERE (:status IS NULL OR p.status = :status) AND ("
            + "p.status IN (com.fyp.supervision.enums.ProposalStatus.UNDER_REVIEW, "
            + "com.fyp.supervision.enums.ProposalStatus.APPROVED) "
            + "OR (p.status IN (com.fyp.supervision.enums.ProposalStatus.REJECTED, "
            + "com.fyp.supervision.enums.ProposalStatus.REVISION_REQUIRED) "
            + "AND EXISTS (SELECT r FROM ProposalReview r WHERE r.proposal = p AND r.reviewerRole = 'FYP_COMMITTEE')))")
    Page<Proposal> findCommitteeVisible(@Param("status") ProposalStatus status, Pageable pageable);
    Optional<Proposal> findByStudent_UserId(Long studentUserId);
    List<Proposal> findBySupervisor_UserId(Long supervisorUserId);
    Page<Proposal> findByStatus(ProposalStatus status, Pageable pageable);
    long countByStatus(ProposalStatus status);
}
