package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.ProjectDocument;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProjectDocumentRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/student/documents")
@RequiredArgsConstructor
public class StudentDocumentController {
    private final ProjectDocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<Page<ProjectDocument>> getDocuments(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String phase,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(documentRepository.findByProject_Student_UserIdOrderByUploadedAtDesc(userId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDocument> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found")));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        ProjectDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        Resource resource = fileStorageService.loadFile(doc.getStoragePath());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream")
                .body(resource);
    }

    @PostMapping
    public ResponseEntity<ProjectDocument> uploadDocument(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String phase) {
        Long userId = Long.parseLong(user.getUsername());
        Project project = projectRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new BadRequestException("No active project found."));

        String storagePath = fileStorageService.storeFile(file, "documents", userId);

        ProjectDocument document = ProjectDocument.builder()
                .project(project)
                .uploadedBy(project.getStudent())
                .title(title != null ? title : file.getOriginalFilename())
                .description(description)
                .docType(type)
                .phase(phase)
                .fileName(file.getOriginalFilename())
                .storagePath(storagePath)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .build();

        return ResponseEntity.ok(documentRepository.save(document));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        ProjectDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUploadedBy().getUserId().equals(userId)) {
            throw new BadRequestException("You can only delete your own documents.");
        }
        fileStorageService.deleteFile(doc.getStoragePath());
        documentRepository.delete(doc);
        return ResponseEntity.noContent().build();
    }
}
