package com.fyp.supervision.controller;

import com.fyp.supervision.entity.ResourceDocument;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ResourceDocumentRepository;
import com.fyp.supervision.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceDocumentRepository resourceDocumentRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<Page<ResourceDocument>> getResources(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String visibility,
            Pageable pageable) {
        Page<ResourceDocument> resources;
        if (category != null && !category.isBlank()) {
            resources = resourceDocumentRepository.findByCategoryAndIsActiveTrueOrderByPublishedAtDesc(category, pageable);
        } else if (visibility != null && !visibility.isBlank()) {
            resources = resourceDocumentRepository.findByVisibilityAndIsActiveTrueOrderByPublishedAtDesc(visibility, pageable);
        } else {
            resources = resourceDocumentRepository.findByIsActiveTrueOrderByPublishedAtDesc(pageable);
        }
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        List<String> categories = resourceDocumentRepository.findDistinctCategories();
        return ResponseEntity.ok(Map.of("categories", categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceDocument> getResource(@PathVariable Long id) {
        ResourceDocument doc = resourceDocumentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        return ResponseEntity.ok(doc);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadResource(@PathVariable Long id) {
        ResourceDocument doc = resourceDocumentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        Resource file = fileStorageService.loadFile(doc.getStoragePath());

        // Increment download count
        if (doc.getDownloadCount() != null) {
            doc.setDownloadCount(doc.getDownloadCount() + 1);
        } else {
            doc.setDownloadCount(1);
        }
        resourceDocumentRepository.save(doc);

        String filename = doc.getFileName() != null ? doc.getFileName() : "download";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(file);
    }
}
