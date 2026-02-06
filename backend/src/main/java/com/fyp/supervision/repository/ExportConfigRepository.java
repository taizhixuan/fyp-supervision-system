package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ExportConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExportConfigRepository extends JpaRepository<ExportConfig, Long> {
}
