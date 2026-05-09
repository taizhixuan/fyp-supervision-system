package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.ProjectDocument;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProjectDocumentRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.service.FileStorageService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@RestController
@RequestMapping("/student/documents")
@RequiredArgsConstructor
public class StudentDocumentController {

    private static final Set<String> ALLOWED_TYPES =
            Set.of("PROPOSAL", "REPORT", "PRESENTATION", "CODE", "DATASET", "OTHER");
    private static final Set<String> ALLOWED_PHASES =
            Set.of("FYP1", "FYP2", "FINAL");
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024; // 50MB

    private final ProjectDocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final FileStorageService fileStorageService;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<?> getDocuments(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String phase,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getDocumentsDto(userId, normalise(type), normalise(phase), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        ProjectDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (doc.getProject() == null || doc.getProject().getStudent() == null
                || !userId.equals(doc.getProject().getStudent().getUserId())) {
            throw new BadRequestException("You can only access your own documents.");
        }
        return ResponseEntity.ok(studentService.buildDocumentDto(doc));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        ProjectDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (doc.getProject() == null || doc.getProject().getStudent() == null
                || !userId.equals(doc.getProject().getStudent().getUserId())) {
            throw new BadRequestException("You can only download your own documents.");
        }
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

    @PostMapping
    public ResponseEntity<?> uploadDocument(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String phase) {
        Long userId = Long.parseLong(user.getUsername());
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please attach a file to upload.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File too large. Maximum size is 50MB.");
        }
        String validatedType = validateEnum(type, ALLOWED_TYPES, "type", "OTHER");
        String validatedPhase = validateEnum(phase, ALLOWED_PHASES, "phase", "FYP1");

        Project project = projectRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new BadRequestException("No active project found."));

        String storagePath = fileStorageService.storeFile(file, "documents", userId);

        String safeTitle = (title == null || title.isBlank()) ? file.getOriginalFilename() : title.trim();
        ProjectDocument document = ProjectDocument.builder()
                .project(project)
                .uploadedBy(project.getStudent())
                .title(safeTitle)
                .description(description != null ? description.trim() : null)
                .docType(validatedType)
                .phase(validatedPhase)
                .fileName(file.getOriginalFilename())
                .storagePath(storagePath)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .build();

        ProjectDocument saved = documentRepository.save(document);
        return ResponseEntity.ok(studentService.buildDocumentDto(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        ProjectDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (doc.getUploadedBy() == null || !doc.getUploadedBy().getUserId().equals(userId)) {
            throw new BadRequestException("You can only delete your own documents.");
        }
        fileStorageService.deleteFile(doc.getStoragePath());
        documentRepository.delete(doc);
        return ResponseEntity.noContent().build();
    }

    private static String normalise(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty() || "undefined".equalsIgnoreCase(trimmed) || "null".equalsIgnoreCase(trimmed)) {
            return null;
        }
        return trimmed.toUpperCase();
    }

    private static String validateEnum(String value, Set<String> allowed, String fieldName, String fallback) {
        String normalised = normalise(value);
        if (normalised == null) return fallback;
        if (!allowed.contains(normalised)) {
            throw new BadRequestException("Invalid " + fieldName + ". Allowed values: " + allowed);
        }
        return normalised;
    }
}
