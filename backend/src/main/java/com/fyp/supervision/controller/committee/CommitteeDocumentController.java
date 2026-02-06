package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.ResourceDocument;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ResourceDocumentRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/committee/documents")
@RequiredArgsConstructor
public class CommitteeDocumentController {
    private final ResourceDocumentRepository resourceDocRepository;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<Page<ResourceDocument>> getDocuments(@RequestParam(required = false) String category, Pageable pageable) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(resourceDocRepository.findByCategoryAndIsActiveTrueOrderByPublishedAtDesc(category, pageable));
        }
        return ResponseEntity.ok(resourceDocRepository.findByIsActiveTrueOrderByPublishedAtDesc(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceDocument> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(resourceDocRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found")));
    }

    @PostMapping
    public ResponseEntity<?> uploadDocument(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String visibility) {
        Long userId = Long.parseLong(user.getUsername());
        UserAccount uploader = userAccountRepository.findById(userId).orElseThrow();
        String storagePath = fileStorageService.storeFile(file, "resources", userId);

        ResourceDocument doc = ResourceDocument.builder()
                .uploadedBy(uploader)
                .title(title)
                .description(description)
                .category(category)
                .fileName(file.getOriginalFilename())
                .storagePath(storagePath)
                .fileSize(file.getSize())
                .visibility(visibility != null ? visibility : "ALL")
                .build();
        ResourceDocument saved = resourceDocRepository.save(doc);
        return ResponseEntity.ok(Map.of("documentId", saved.getResourceId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        ResourceDocument doc = resourceDocRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        doc.setIsActive(false);
        resourceDocRepository.save(doc);
        return ResponseEntity.noContent().build();
    }
}
