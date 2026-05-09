package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ApprovedSupervisorRoster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovedSupervisorRosterRepository extends JpaRepository<ApprovedSupervisorRoster, Long> {

    Optional<ApprovedSupervisorRoster> findByMmuId(String mmuId);

    Optional<ApprovedSupervisorRoster> findByEmail(String email);

    Optional<ApprovedSupervisorRoster> findByMmuIdAndEmail(String mmuId, String email);

    List<ApprovedSupervisorRoster> findAllByOrderByUploadedAtDesc();
}
