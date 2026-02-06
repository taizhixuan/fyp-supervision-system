package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.ResourceDocument;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ResourceDocumentRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.CommitteeService;
import com.fyp.supervision.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/committee/documents")
@RequiredArgsConstructor
public class CommitteeDocumentController {
    private final ResourceDocumentRepository resourceDocRepo;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageService fileStorageService;
    private final CommitteeService committeeService;

    @GetMapping
    public ResponseEntity<?> getDocuments(@RequestParam(required = false) String category, Pageable pageable) {
        Page<ResourceDocument> page;
        if (category != null && !category.isBlank()) {
            page = resourceDocRepo.findByCategoryAndIsActiveTrueOrderByPublishedAtDesc(category, pageable);
        } else {
            page = resourceDocRepo.findByIsActiveTrueOrderByPublishedAtDesc(pageable);
        }
        List<Map<String, Object>> dtos = page.getContent().stream()
                .map(committeeService::buildResourceDocumentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("documents", dtos, "total", page.getTotalElements()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable Long id) {
        ResourceDocument doc = resourceDocRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        return ResponseEntity.ok(committeeService.buildResourceDocumentDto(doc));
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
                .visibility(visibility != null ? visibility : "PUBLIC")
                .build();
        ResourceDocument saved = resourceDocRepo.save(doc);
        return ResponseEntity.ok(committeeService.buildResourceDocumentDto(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        ResourceDocument doc = resourceDocRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        doc.setIsActive(false);
        resourceDocRepo.save(doc);
        return ResponseEntity.noContent().build();
    }
}
