package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.DocumentFeedback;
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
import org.springframework.web.multipart.MultipartFile;

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
        return fileResponse(resource, fileName, doc.getMimeType());
    }

    @PostMapping(value = "/{id}/feedback", consumes = {"multipart/form-data", "multipart/form-data;charset=UTF-8"})
    public ResponseEntity<?> provideFeedback(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestParam("content") String content,
            @RequestParam(value = "annotatedFile", required = false) MultipartFile annotatedFile) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> dto = supervisorService.submitDocumentFeedback(userId, id, content, annotatedFile);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/feedback/{feedbackId}/download")
    public ResponseEntity<Resource> downloadFeedbackFile(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long feedbackId) {
        Long userId = Long.parseLong(user.getUsername());
        DocumentFeedback fb = supervisorService.getOwnedFeedback(userId, feedbackId);
        if (fb.getAnnotatedFilePath() == null) {
            throw new BadRequestException("No annotated file attached to this feedback.");
        }
        Resource resource = fileStorageService.loadFile(fb.getAnnotatedFilePath());
        String fileName = fb.getAnnotatedFileName() != null ? fb.getAnnotatedFileName() : "feedback-annotated";
        return fileResponse(resource, fileName, null);
    }

    private ResponseEntity<Resource> fileResponse(Resource resource, String fileName, String mimeType) {
        String encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName.replace("\"", "") + "\"; filename*=UTF-8''" + encoded)
                .header(HttpHeaders.CONTENT_TYPE,
                        mimeType != null ? mimeType : "application/octet-stream")
                .body(resource);
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
