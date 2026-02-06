package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ProposalCheckResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalCheckResultRepository extends JpaRepository<ProposalCheckResult, Long> {
    Optional<ProposalCheckResult> findTopByVersion_VersionIdOrderByCheckedAtDesc(Long versionId);
    List<ProposalCheckResult> findByProposal_ProposalIdOrderByCheckedAtDesc(Long proposalId);
}
