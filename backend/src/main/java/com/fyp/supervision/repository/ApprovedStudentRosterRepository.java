package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ApprovedStudentRoster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovedStudentRosterRepository extends JpaRepository<ApprovedStudentRoster, Long> {

    Optional<ApprovedStudentRoster> findByMmuId(String mmuId);

    Optional<ApprovedStudentRoster> findByEmail(String email);

    Optional<ApprovedStudentRoster> findByMmuIdAndEmail(String mmuId, String email);

    List<ApprovedStudentRoster> findAllByOrderByUploadedAtDesc();
}
