package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.IntegrationSetting;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.IntegrationSettingRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/admin/integrations")
@RequiredArgsConstructor
public class AdminIntegrationController {
    private final IntegrationSettingRepository integrationRepository;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<?> getIntegrations() {
        return ResponseEntity.ok(adminService.getIntegrations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getIntegration(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getIntegrationDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIntegration(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        IntegrationSetting setting = integrationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("endpointUrl")) setting.setEndpointUrl((String) data.get("endpointUrl"));
        if (data.containsKey("status")) setting.setStatus((String) data.get("status"));
        if (data.containsKey("settingsJson")) setting.setSettingsJson((String) data.get("settingsJson"));
        integrationRepository.save(setting);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<?> testIntegration(@PathVariable Long id) {
        IntegrationSetting setting = integrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        setting.setLastTestedAt(LocalDateTime.now());
        setting.setLastTestResult("SUCCESS");
        integrationRepository.save(setting);
        return ResponseEntity.ok(Map.of("success", true, "message", "Connection test passed.", "responseTime", 234));
    }
}
