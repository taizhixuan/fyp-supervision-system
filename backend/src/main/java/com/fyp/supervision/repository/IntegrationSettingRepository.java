package com.fyp.supervision.repository;

import com.fyp.supervision.entity.IntegrationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IntegrationSettingRepository extends JpaRepository<IntegrationSetting, Long> {
}
