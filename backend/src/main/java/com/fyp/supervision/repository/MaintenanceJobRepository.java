package com.fyp.supervision.repository;

import com.fyp.supervision.entity.MaintenanceJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceJobRepository extends JpaRepository<MaintenanceJob, Long> {

    List<MaintenanceJob> findAllByOrderByCreatedAtDesc();
}
