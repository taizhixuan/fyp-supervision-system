package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.ProjectDocument;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProjectDocumentRepository;
import com.fyp.supervision.service.FileStorageService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/documents")
@RequiredArgsConstructor
public class SupervisorDocumentController {
    private final SupervisorService supervisorService;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<?> getDocuments(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String type) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> documents = supervisorService.getDocumentDtos(userId, studentId, type);
        return ResponseEntity.ok(Map.of("documents", documents, "total", documents.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        ProjectDocument doc = ensureSupervisorOwnsDocument(userId, id);
        return ResponseEntity.ok(supervisorService.buildDocumentDto(doc));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        ProjectDocument doc = ensureSupervisorOwnsDocument(userId, id);
        Resource resource = fileStorageService.loadFile(doc.getStoragePath());
        String fileName = doc.getFileName() != null ? doc.getFileName() : "document";
        String encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName.replace("\"", "") + "\"; filename*=UTF-8''" + encoded)
                .header(HttpHeaders.CONTENT_TYPE,
                        doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream")
                .body(resource);
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> provideFeedback(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        // Stub — document feedback not yet implemented
        return ResponseEntity.ok(Map.of("success", true));
    }

    private ProjectDocument ensureSupervisorOwnsDocument(Long supervisorUserId, Long documentId) {
        ProjectDocument doc = projectDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (doc.getProject() == null || doc.getProject().getSupervisor() == null
                || !supervisorUserId.equals(doc.getProject().getSupervisor().getUserId())) {
            throw new BadRequestException("You can only access documents from your supervisees.");
        }
        return doc;
    }
}
