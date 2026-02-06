package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ProposalVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalVersionRepository extends JpaRepository<ProposalVersion, Long> {
    List<ProposalVersion> findByProposal_ProposalIdOrderByVersionNoDesc(Long proposalId);
}
