package com.fyp.supervision.controller;

import com.fyp.supervision.entity.ResourceDocument;
import com.fyp.supervision.exception.ForbiddenException;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceDocumentRepository resourceDocumentRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<?> getResources(
            @RequestParam(required = false) String category,
            Authentication auth,
            Pageable pageable) {
        Set<String> allowed = allowedVisibilities(auth);
        Page<ResourceDocument> page;
        if (category != null && !category.isBlank()) {
            page = resourceDocumentRepository
                    .findByCategoryAndVisibilityInAndIsActiveTrueOrderByPublishedAtDesc(category, allowed, pageable);
        } else {
            page = resourceDocumentRepository
                    .findByVisibilityInAndIsActiveTrueOrderByPublishedAtDesc(allowed, pageable);
        }
        List<Map<String, Object>> dtos = page.getContent().stream()
                .map(this::buildResourceDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("resources", dtos, "total", page.getTotalElements()));
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        List<String> categories = resourceDocumentRepository.findDistinctCategories();
        return ResponseEntity.ok(Map.of("categories", categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getResource(@PathVariable Long id, Authentication auth) {
        ResourceDocument doc = resourceDocumentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        if (!allowedVisibilities(auth).contains(doc.getVisibility() != null ? doc.getVisibility() : "PUBLIC")) {
            throw new ForbiddenException("Not permitted to view this resource");
        }
        return ResponseEntity.ok(buildResourceDto(doc));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadResource(@PathVariable Long id, Authentication auth) {
        ResourceDocument doc = resourceDocumentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        if (!allowedVisibilities(auth).contains(doc.getVisibility() != null ? doc.getVisibility() : "PUBLIC")) {
            throw new ForbiddenException("Not permitted to download this resource");
        }

        Resource file = fileStorageService.loadFile(doc.getStoragePath());

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

    private Set<String> allowedVisibilities(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) {
            return Set.of("PUBLIC");
        }
        Set<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        if (roles.contains("SYSTEM_ADMIN") || roles.contains("FYP_COMMITTEE")) {
            return Set.of("PUBLIC", "STUDENTS_ONLY", "SUPERVISORS_ONLY", "COMMITTEE_ONLY");
        }
        if (roles.contains("SUPERVISOR")) {
            return Set.of("PUBLIC", "SUPERVISORS_ONLY");
        }
        if (roles.contains("STUDENT")) {
            return Set.of("PUBLIC", "STUDENTS_ONLY");
        }
        return Set.of("PUBLIC");
    }

    private Map<String, Object> buildResourceDto(ResourceDocument doc) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("resourceId", doc.getResourceId());
        dto.put("category", doc.getCategory() != null ? doc.getCategory() : "OTHER");
        dto.put("title", doc.getTitle());
        dto.put("description", doc.getDescription());
        dto.put("fileUrl", doc.getStoragePath());
        dto.put("fileName", doc.getFileName());
        dto.put("fileSize", doc.getFileSize());
        dto.put("visibility", doc.getVisibility() != null ? doc.getVisibility() : "PUBLIC");
        dto.put("isFeatured", false);
        dto.put("downloadCount", doc.getDownloadCount());
        dto.put("tags", List.of());
        dto.put("publishedAt", doc.getPublishedAt() != null ? doc.getPublishedAt().toString() : "");
        return dto;
    }
}
