package com.fyp.supervision.controller;

import com.fyp.supervision.entity.SystemParameter;
import com.fyp.supervision.repository.SystemParameterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemParameterRepository systemParameterRepository;

    @GetMapping("/parameters/public")
    public ResponseEntity<?> getPublicParameters() {
        List<SystemParameter> parameters = systemParameterRepository.findAll();
        return ResponseEntity.ok(Map.of("parameters", parameters));
    }
}
