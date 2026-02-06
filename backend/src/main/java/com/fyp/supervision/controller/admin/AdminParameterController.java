package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.SystemParameter;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.SystemParameterRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/parameters")
@RequiredArgsConstructor
public class AdminParameterController {
    private final SystemParameterRepository parameterRepository;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<?> getParameters(@RequestParam(required = false) String category) {
        return ResponseEntity.ok(adminService.getParameters(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getParameter(@PathVariable Long id) {
        SystemParameter param = parameterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        return ResponseEntity.ok(adminService.buildParameterDto(param));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateParameter(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        SystemParameter param = parameterRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("value")) param.setParamValue((String) data.get("value"));
        parameterRepository.save(param);
        return ResponseEntity.ok(adminService.buildParameterDto(param));
    }
}
