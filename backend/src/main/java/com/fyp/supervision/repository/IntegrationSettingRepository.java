package com.fyp.supervision.repository;

import com.fyp.supervision.entity.IntegrationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IntegrationSettingRepository extends JpaRepository<IntegrationSetting, Long> {

    List<IntegrationSetting> findByIntegrationType(String integrationType);

    Optional<IntegrationSetting> findFirstByNameIgnoreCase(String name);
}
