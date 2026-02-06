package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.ProjectDocument;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProjectDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/documents")
@RequiredArgsConstructor
public class SupervisorDocumentController {
    private final ProjectDocumentRepository documentRepository;

    @GetMapping
    public ResponseEntity<?> getDocuments(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String type) {
        // For now return all documents for the supervisor's students
        List<ProjectDocument> docs;
        if (studentId != null) {
            docs = documentRepository.findByProject_Student_UserIdAndDocTypeOrderByUploadedAtDesc(studentId, type);
        } else {
            docs = documentRepository.findAll();
        }
        return ResponseEntity.ok(Map.of("documents", docs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDocument> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found")));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> provideFeedback(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(Map.of("success", true));
    }
}
