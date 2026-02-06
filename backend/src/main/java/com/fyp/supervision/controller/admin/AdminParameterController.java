package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.SystemParameter;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.SystemParameterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/parameters")
@RequiredArgsConstructor
public class AdminParameterController {
    private final SystemParameterRepository parameterRepository;

    @GetMapping
    public ResponseEntity<?> getParameters(@RequestParam(required = false) String category) {
        List<SystemParameter> params;
        if (category != null && !category.isBlank()) {
            params = parameterRepository.findByCategoryOrderByParamKeyAsc(category);
        } else {
            params = parameterRepository.findAll();
        }
        return ResponseEntity.ok(Map.of("parameters", params));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SystemParameter> getParameter(@PathVariable Long id) {
        return ResponseEntity.ok(parameterRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SystemParameter> updateParameter(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        SystemParameter param = parameterRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("value")) param.setParamValue((String) data.get("value"));
        return ResponseEntity.ok(parameterRepository.save(param));
    }
}
