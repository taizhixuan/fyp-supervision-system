package com.fyp.supervision.controller;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.ResourceDocument;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.ResourceDocumentRepository;
import com.fyp.supervision.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceDocumentRepository resourceDocumentRepository;
    private final ProjectRepository projectRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<?> getResources(
            @RequestParam(required = false) String category,
            Authentication auth,
            Pageable pageable) {
        Set<String> allowed = allowedVisibilities(auth);
        StudentCycleScope scope = studentCycleScope(auth);

        // For a student whose cycle has ended, the per-row cycle filter must run BEFORE
        // pagination so the totals/pagination math stays correct. Resource volume is
        // low (templates, guides), so fetching unpaged and slicing is fine.
        if (scope.appliesFilter()) {
            Page<ResourceDocument> all = (category != null && !category.isBlank())
                    ? resourceDocumentRepository
                        .findByCategoryAndVisibilityInAndIsActiveTrueOrderByPublishedAtDesc(category, allowed, Pageable.unpaged())
                    : resourceDocumentRepository
                        .findByVisibilityInAndIsActiveTrueOrderByPublishedAtDesc(allowed, Pageable.unpaged());
            List<ResourceDocument> visible = all.getContent().stream()
                    .filter(scope::permits)
                    .toList();
            int from = Math.min((int) pageable.getOffset(), visible.size());
            int to = Math.min(from + pageable.getPageSize(), visible.size());
            List<Map<String, Object>> dtos = visible.subList(from, to).stream()
                    .map(this::buildResourceDto)
                    .toList();
            Page<Map<String, Object>> resultPage = new PageImpl<>(dtos, pageable, visible.size());
            return ResponseEntity.ok(Map.of("resources", resultPage.getContent(), "total", resultPage.getTotalElements()));
        }

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
        StudentCycleScope scope = studentCycleScope(auth);
        if (scope.appliesFilter() && !scope.permits(doc)) {
            throw new ForbiddenException("This resource belongs to a different cohort cycle.");
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
        StudentCycleScope scope = studentCycleScope(auth);
        if (scope.appliesFilter() && !scope.permits(doc)) {
            throw new ForbiddenException("This resource belongs to a different cohort cycle.");
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

    /**
     * Resolve the caller's per-cohort scope for the resource list. A student whose
     * enrolled cycle is COMPLETED/ARCHIVED only sees evergreen resources (cycle_id IS NULL)
     * plus resources pinned to their own cycle. Everyone else (active student, supervisor,
     * committee, admin) sees every visibility-permitted resource.
     */
    private StudentCycleScope studentCycleScope(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return StudentCycleScope.unfiltered();
        boolean isStudent = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("STUDENT"::equals);
        if (!isStudent) return StudentCycleScope.unfiltered();
        Long userId;
        try {
            userId = Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            return StudentCycleScope.unfiltered();
        }
        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(userId);
        if (projectOpt.isEmpty()) return StudentCycleScope.unfiltered();
        FypCycle cycle = projectOpt.get().getCycle();
        if (cycle == null) return StudentCycleScope.unfiltered();
        if (cycle.getStatus() != CycleStatus.COMPLETED && cycle.getStatus() != CycleStatus.ARCHIVED) {
            return StudentCycleScope.unfiltered();
        }
        return StudentCycleScope.lockedTo(cycle.getCycleId());
    }

    /**
     * Hide newer-cohort uploads from students whose own cycle is COMPLETED/ARCHIVED.
     * {@code lockedCycleId == null} means no filter (default).
     */
    private record StudentCycleScope(Long lockedCycleId) {
        static StudentCycleScope unfiltered() { return new StudentCycleScope(null); }
        static StudentCycleScope lockedTo(Long cycleId) { return new StudentCycleScope(cycleId); }
        boolean appliesFilter() { return lockedCycleId != null; }
        boolean permits(ResourceDocument doc) {
            if (lockedCycleId == null) return true;
            FypCycle docCycle = doc.getCycle();
            if (docCycle == null) return true; // evergreen
            return Objects.equals(docCycle.getCycleId(), lockedCycleId);
        }
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
        // isFeatured + tags were placeholders — entity has no columns for them. Dropped
        // from the response; the optional fields on the frontend Resource type will
        // simply be undefined, and existing `.filter(r => r.isFeatured)` calls behave
        // the same as before (empty list).
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("resourceId", doc.getResourceId());
        dto.put("category", doc.getCategory() != null ? doc.getCategory() : "OTHER");
        dto.put("title", doc.getTitle());
        dto.put("description", doc.getDescription());
        dto.put("fileUrl", doc.getStoragePath());
        dto.put("fileName", doc.getFileName());
        dto.put("fileSize", doc.getFileSize());
        dto.put("visibility", doc.getVisibility() != null ? doc.getVisibility() : "PUBLIC");
        dto.put("downloadCount", doc.getDownloadCount());
        dto.put("cycleId", doc.getCycle() != null ? doc.getCycle().getCycleId() : null);
        dto.put("cycleType", doc.getCycle() != null ? doc.getCycle().getCycleType() : null);
        dto.put("cycleAcademicYear", doc.getCycle() != null ? doc.getCycle().getAcademicYear() : null);
        dto.put("publishedAt", doc.getPublishedAt() != null ? doc.getPublishedAt().toString() : "");
        return dto;
    }
}
