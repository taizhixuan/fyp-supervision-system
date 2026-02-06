package com.fyp.supervision.repository;

import com.fyp.supervision.entity.GeneratedReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeneratedReportRepository extends JpaRepository<GeneratedReport, Long> {

    List<GeneratedReport> findAllByOrderByGeneratedAtDesc();
}
