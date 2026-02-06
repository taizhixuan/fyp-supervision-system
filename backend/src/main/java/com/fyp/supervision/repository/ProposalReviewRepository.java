package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ProposalReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalReviewRepository extends JpaRepository<ProposalReview, Long> {
    List<ProposalReview> findByProposal_ProposalIdOrderByReviewedAtDesc(Long proposalId);
}
