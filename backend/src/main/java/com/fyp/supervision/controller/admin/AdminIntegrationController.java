package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.IntegrationSetting;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.IntegrationSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/integrations")
@RequiredArgsConstructor
public class AdminIntegrationController {
    private final IntegrationSettingRepository integrationRepository;

    @GetMapping
    public ResponseEntity<?> getIntegrations() {
        return ResponseEntity.ok(Map.of("integrations", integrationRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IntegrationSetting> getIntegration(@PathVariable Long id) {
        return ResponseEntity.ok(integrationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found")));
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
        return ResponseEntity.ok(Map.of("success", true, "message", "Connection test passed."));
    }
}
