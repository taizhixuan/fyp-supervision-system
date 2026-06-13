package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.entity.AnnouncementAttachment;
import com.fyp.supervision.entity.AnnouncementAudience;
import com.fyp.supervision.entity.AnnouncementLink;
import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.AnnouncementStatus;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AnnouncementReadRepository;
import com.fyp.supervision.repository.AnnouncementRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Single source of truth for announcement queries, audience filtering, attachments, and
 * external links. Used by both the shared (student-facing) and role-scoped (supervisor /
 * committee) controllers so they all agree on what a student is allowed to see.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementReadRepository announcementReadRepository;
    private final ProjectRepository projectRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final FypCycleRepository fypCycleRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    // Tunable bounds for title/content. Backstop against the test-data case where
    // title == content; minimum length nudges authors to write something the
    // student can actually understand.
    private static final int MIN_TITLE_LENGTH = 3;
    private static final int MIN_CONTENT_LENGTH = 5;

    // ---------- Reads ----------

    public Page<Map<String, Object>> listForStudent(Long studentUserId, Pageable pageable) {
        // Audience filter must run before pagination, otherwise the per-page
        // count drifts (DB returns N rows, filter drops some, you get < N) and
        // `total` ends up as the filtered slice size instead of the global
        // count. Announcement volume per cycle is low enough that loading all
        // PUBLISHED rows here is fine; switch to a JPQL predicate if it ever
        // grows out of hand.
        StudentContext ctx = loadStudentContext(studentUserId);
        List<Announcement> visible = announcementRepository
                .findByStatusOrderByCreatedAtDesc(AnnouncementStatus.PUBLISHED, Pageable.unpaged())
                .getContent().stream()
                .filter(a -> matchesAudience(a, ctx))
                .toList();
        Set<Long> readIds = announcementReadRepository.readIdsForUser(
                studentUserId, visible.stream().map(Announcement::getAnnouncementId).toList());
        List<Map<String, Object>> dtos = visible.stream()
                .map(a -> buildDto(a, readIds))
                .toList();
        int from = Math.min((int) pageable.getOffset(), dtos.size());
        int to = Math.min(from + pageable.getPageSize(), dtos.size());
        return new PageImpl<>(dtos.subList(from, to), pageable, dtos.size());
    }

    public List<Map<String, Object>> latestForStudent(Long studentUserId, int limit) {
        StudentContext ctx = loadStudentContext(studentUserId);
        // Fetch all PUBLISHED rows, then audience-filter, then take the requested limit.
        // The previous findTop5* hard-limited at the DB layer, so an audience filter
        // that dropped any of the 5 would return fewer items than the caller requested.
        List<Announcement> visible = announcementRepository
                .findByStatusOrderByCreatedAtDesc(AnnouncementStatus.PUBLISHED,
                        org.springframework.data.domain.Pageable.unpaged())
                .getContent().stream()
                .filter(a -> matchesAudience(a, ctx))
                .limit(limit)
                .toList();
        Set<Long> readIds = announcementReadRepository.readIdsForUser(
                studentUserId, visible.stream().map(Announcement::getAnnouncementId).toList());
        return visible.stream().map(a -> buildDto(a, readIds)).toList();
    }

    public List<Map<String, Object>> listAllPublished(Pageable pageable) {
        return announcementRepository.findByStatusOrderByCreatedAtDesc(AnnouncementStatus.PUBLISHED, pageable)
                .getContent().stream().map(this::buildDto).toList();
    }

    /**
     * Inbox+outbox view for a supervisor: returns announcements they created (SENT) plus
     * announcements created by committee or admin (RECEIVED) — what a supervisor would
     * naturally expect to see in their announcements page. Each DTO carries a
     * {@code direction} field so the frontend can show a "Sent" / "From committee" badge
     * and hide Edit/Delete on received ones.
     *
     * <p>Other supervisors' announcements are excluded — those are scoped to a different
     * supervisor's supervisees and are not relevant here.
     */
    public List<Map<String, Object>> listForSupervisor(Long supervisorUserId, Pageable pageable) {
        return announcementRepository.findByStatusOrderByCreatedAtDesc(AnnouncementStatus.PUBLISHED, pageable)
                .getContent().stream()
                .filter(a -> isVisibleToSupervisor(a, supervisorUserId))
                .map(a -> {
                    Map<String, Object> dto = buildDto(a);
                    boolean isOwn = a.getCreatedBy() != null
                            && Objects.equals(a.getCreatedBy().getUserId(), supervisorUserId);
                    dto.put("direction", isOwn ? "SENT" : "RECEIVED");
                    return dto;
                })
                .toList();
    }

    private boolean isVisibleToSupervisor(Announcement a, Long supervisorUserId) {
        if (a.getCreatedBy() == null) return false;
        // Their own announcements (any audience).
        if (Objects.equals(a.getCreatedBy().getUserId(), supervisorUserId)) return true;
        // Anything published by committee/admin counts as inbox.
        UserRole authorRole = a.getCreatedBy().getRole();
        return authorRole == UserRole.FYP_COMMITTEE || authorRole == UserRole.SYSTEM_ADMIN;
    }

    /**
     * Whether {@code userId} is allowed to see this announcement. Committee/admin and the
     * author see everything; supervisors get inbox visibility; students must match the
     * per-row audience filter. Used to gate the by-id read and the attachment download so
     * they can't bypass the audience scoping the list views enforce.
     */
    private boolean isVisibleToUser(Announcement a, Long userId) {
        if (userId == null) return false;
        UserAccount user = userAccountRepository.findById(userId).orElse(null);
        if (user == null) return false;
        UserRole role = user.getRole();
        if (role == UserRole.FYP_COMMITTEE || role == UserRole.SYSTEM_ADMIN) return true;
        if (a.getCreatedBy() != null && Objects.equals(a.getCreatedBy().getUserId(), userId)) return true;
        if (role == UserRole.SUPERVISOR) return isVisibleToSupervisor(a, userId);
        return matchesAudience(a, loadStudentContext(userId));
    }

    private boolean isAuthorOrPrivileged(Announcement a, Long userId) {
        if (userId == null) return false;
        if (a.getCreatedBy() != null && Objects.equals(a.getCreatedBy().getUserId(), userId)) return true;
        UserAccount user = userAccountRepository.findById(userId).orElse(null);
        return user != null
                && (user.getRole() == UserRole.FYP_COMMITTEE || user.getRole() == UserRole.SYSTEM_ADMIN);
    }

    public Map<String, Object> get(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        return buildDto(a);
    }

    public Map<String, Object> getForUser(Long announcementId, Long userId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        // 404 (not 403) when out of audience so a user can't probe which ids exist.
        if (!isVisibleToUser(a, userId)) {
            throw new ResourceNotFoundException("Announcement not found");
        }
        Set<Long> readIds = userId == null ? Set.of()
                : announcementReadRepository.readIdsForUser(userId, List.of(announcementId));
        Map<String, Object> dto = buildDto(a, readIds);
        // Don't leak the recipient list to non-authors.
        if (!isAuthorOrPrivileged(a, userId)) {
            dto.remove("targetStudentIds");
        }
        return dto;
    }

    /**
     * Mark an announcement as read for a user. First-time read also increments the
     * announcement's {@code viewCount} (so viewCount = unique reader count, not
     * raw page views). Subsequent calls are no-ops thanks to the PK on
     * {@code announcement_read}.
     */
    @Transactional
    public boolean recordRead(Long announcementId, Long userId) {
        if (userId == null) return false;
        if (!announcementRepository.existsById(announcementId)) {
            throw new ResourceNotFoundException("Announcement not found");
        }
        int inserted = announcementReadRepository.insertIgnore(userId, announcementId);
        if (inserted > 0) {
            // Only bump the counter on a genuinely new read so refreshes don't inflate it.
            // Atomic UPDATE so two concurrent first-time readers can't lose an increment.
            announcementRepository.incrementViewCount(announcementId);
            return true;
        }
        return false;
    }

    /**
     * Bulk mark — used by the "Mark all read" button. Iterates rather than a
     * single batched INSERT IGNORE because we also need to bump viewCount for
     * each newly-inserted row, which the native query alone can't tell us.
     */
    @Transactional
    public int markAllRead(Long userId, Collection<Long> announcementIds) {
        if (userId == null || announcementIds == null || announcementIds.isEmpty()) return 0;
        int newly = 0;
        for (Long id : announcementIds) {
            if (id == null) continue;
            try {
                if (recordRead(id, userId)) newly++;
            } catch (ResourceNotFoundException ignored) {
                // Skip silently — the announcement may have been deleted between
                // the client loading the list and pressing the bulk-mark button.
            }
        }
        return newly;
    }

    public AnnouncementAttachment loadAttachment(Long announcementId, Long attachmentId, Long userId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        // Gate the file behind the same audience filter as the announcement itself,
        // otherwise any authenticated user could pull an attachment they can't see.
        if (!isVisibleToUser(a, userId)) {
            throw new ResourceNotFoundException("Attachment not found");
        }
        return a.getAttachments().stream()
                .filter(att -> Objects.equals(att.getAttachmentId(), attachmentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
    }

    // ---------- Writes ----------

    /**
     * Create an announcement with optional file attachments, external links and per-student
     * targeting (SPECIFIC_STUDENTS scope, supervisor side). The payload is the JSON
     * already-parsed by Jackson; files are uploaded multipart parts.
     */
    @Transactional
    public Map<String, Object> create(Long creatorUserId, Map<String, Object> payload, MultipartFile[] files) {
        UserAccount creator = userAccountRepository.findById(creatorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String scope = optString(payload, "scope");
        if (scope == null || scope.isBlank()) {
            scope = optString(payload, "visibility");
        }
        if (scope == null || scope.isBlank()) scope = "ALL";

        String title = requireString(payload, "title").trim();
        String content = requireString(payload, "content").trim();

        // Validate before we touch the DB: title and content must be distinct
        // and substantive, otherwise the list view fills up with "Test / Test"
        // noise that the audience can't act on.
        if (title.length() < MIN_TITLE_LENGTH) {
            throw new BadRequestException(
                    "Title must be at least " + MIN_TITLE_LENGTH + " characters.");
        }
        if (content.length() < MIN_CONTENT_LENGTH) {
            throw new BadRequestException(
                    "Content must be at least " + MIN_CONTENT_LENGTH + " characters.");
        }
        if (title.equalsIgnoreCase(content)) {
            throw new BadRequestException(
                    "Title and content must be different — write a brief summary in the title and the details in the content.");
        }

        // Stamp the active cycle of the matching type so the audience filter can
        // pin this announcement to a specific cohort. Falls back to NULL for
        // ALL / PROGRAMME_* / SPECIFIC_STUDENTS scopes (no cycle dependency).
        FypCycle scopedCycle = null;
        if ("FYP1".equalsIgnoreCase(scope) || "FYP2".equalsIgnoreCase(scope)) {
            scopedCycle = fypCycleRepository
                    .findFirstByCycleTypeAndStatusOrderByStartDateDesc(scope.toUpperCase(Locale.ROOT), CycleStatus.ACTIVE)
                    .orElse(null);
        }

        Announcement announcement = Announcement.builder()
                .createdBy(creator)
                .cycle(scopedCycle)
                .scope(scope)
                .title(title)
                .content(content)
                .priority(optString(payload, "priority", "NORMAL"))
                .status(AnnouncementStatus.PUBLISHED)
                .publishAt(LocalDateTime.now())
                .build();
        announcement = announcementRepository.save(announcement);

        // External links
        Object linksRaw = payload.get("links");
        if (linksRaw instanceof List<?> list) {
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> m)) continue;
                Object label = m.get("label");
                Object url = m.get("url");
                if (label == null || url == null
                        || label.toString().isBlank() || url.toString().isBlank()) continue;
                AnnouncementLink link = AnnouncementLink.builder()
                        .announcement(announcement)
                        .label(label.toString().trim())
                        .url(url.toString().trim())
                        .build();
                announcement.getLinks().add(link);
            }
        }

        // Specific-student targeting (supervisor side)
        Object targetIdsRaw = payload.get("targetStudentIds");
        if ("SPECIFIC_STUDENTS".equalsIgnoreCase(scope) && targetIdsRaw instanceof List<?> ids) {
            for (Object id : ids) {
                Long studentId = parseLong(id);
                if (studentId == null) continue;
                UserAccount target = userAccountRepository.findById(studentId).orElse(null);
                if (target == null) continue;
                AnnouncementAudience aud = AnnouncementAudience.builder()
                        .announcement(announcement)
                        .targetStudent(target)
                        .build();
                announcement.getAudiences().add(aud);
            }
        }

        // File attachments
        if (files != null) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                String storedPath = fileStorageService.storeFile(file, "announcement", creatorUserId);
                AnnouncementAttachment att = AnnouncementAttachment.builder()
                        .announcement(announcement)
                        .fileName(Optional.ofNullable(file.getOriginalFilename()).orElse("file"))
                        .filePath(storedPath)
                        .fileSize(file.getSize())
                        .mimeType(file.getContentType())
                        .uploadedAt(LocalDateTime.now())
                        .build();
                announcement.getAttachments().add(att);
            }
        }

        Announcement saved = announcementRepository.save(announcement);
        return buildDto(saved);
    }

    /**
     * Parse the multipart `data` JSON part and delegate to {@link #create}. Used by the
     * supervisor/committee controllers so callers don't need to repeat the parsing.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> createFromMultipart(Long creatorUserId, String dataJson, MultipartFile[] files) {
        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(dataJson, Map.class);
        } catch (Exception e) {
            throw new BadRequestException("Invalid JSON payload: " + e.getMessage());
        }
        return create(creatorUserId, payload, files);
    }

    @Transactional
    public void delete(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        for (AnnouncementAttachment att : a.getAttachments()) {
            fileStorageService.deleteFile(att.getFilePath());
        }
        announcementRepository.delete(a);
    }

    // ---------- DTO ----------

    public Map<String, Object> buildDto(Announcement a) {
        return buildDto(a, Set.of());
    }

    public Map<String, Object> buildDto(Announcement a, Set<Long> readIds) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("announcementId", a.getAnnouncementId());
        dto.put("scope", a.getScope() != null ? a.getScope() : "ALL");
        dto.put("visibility", a.getScope() != null ? a.getScope() : "ALL");
        dto.put("title", a.getTitle());
        dto.put("content", a.getContent());
        dto.put("priority", a.getPriority() != null ? a.getPriority() : "NORMAL");
        dto.put("status", a.getStatus() != null ? a.getStatus().name() : "PUBLISHED");
        dto.put("publishAt", a.getPublishAt() != null ? a.getPublishAt().toString() : "");
        dto.put("expiresAt", a.getExpiresAt() != null ? a.getExpiresAt().toString() : null);
        dto.put("createdBy", a.getCreatedBy() != null ? a.getCreatedBy().getFullName() : "");
        dto.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : "");
        dto.put("updatedAt", a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : "");
        dto.put("viewCount", a.getViewCount());
        dto.put("isActive", a.getStatus() == AnnouncementStatus.PUBLISHED);
        dto.put("isRead", readIds != null && readIds.contains(a.getAnnouncementId()));
        dto.put("attachments", a.getAttachments().stream().map(this::attachmentDto).toList());
        dto.put("links", a.getLinks().stream().map(this::linkDto).toList());
        List<Long> targetStudentIds = a.getAudiences().stream()
                .filter(au -> au.getTargetStudent() != null)
                .map(au -> au.getTargetStudent().getUserId())
                .toList();
        dto.put("targetStudentIds", targetStudentIds);
        return dto;
    }

    private Map<String, Object> attachmentDto(AnnouncementAttachment att) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("attachmentId", att.getAttachmentId());
        m.put("fileName", att.getFileName());
        m.put("fileSize", att.getFileSize());
        m.put("mimeType", att.getMimeType());
        m.put("downloadUrl", "/announcements/" + att.getAnnouncement().getAnnouncementId()
                + "/attachments/" + att.getAttachmentId());
        return m;
    }

    private Map<String, Object> linkDto(AnnouncementLink link) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("linkId", link.getLinkId());
        m.put("label", link.getLabel());
        m.put("url", link.getUrl());
        return m;
    }

    // ---------- Audience matching ----------

    private boolean matchesAudience(Announcement a, StudentContext ctx) {
        String scope = a.getScope() == null ? "ALL" : a.getScope().trim().toUpperCase(Locale.ROOT);

        // Pure broadcast — every student sees this (regardless of cycle status).
        if ("ALL".equals(scope) || "ALL_STUDENTS".equals(scope) || "ALL_SUPERVISEES".equals(scope)) {
            // ALL_SUPERVISEES is supervisor-side and only relevant if the student is paired
            // with this announcement's author. Treat as broadcast for now (committee hides
            // it via scope choice; supervisor announcements with this scope go to all of
            // their supervisees).
            if ("ALL_SUPERVISEES".equals(scope)) {
                return ctx.supervisorUserId != null
                        && a.getCreatedBy() != null
                        && Objects.equals(a.getCreatedBy().getUserId(), ctx.supervisorUserId);
            }
            return true;
        }

        // Cohort-bound scopes (FYP1 / FYP2 / PROGRAMME_*) must respect cycle ownership
        // once the student's cycle has ended — otherwise an alumnus of last year's FYP2
        // would keep receiving the new cohort's content.
        boolean cohortBound = "FYP1".equals(scope) || "FYP2".equals(scope) || scope.startsWith("PROGRAMME_");
        if (cohortBound && ctx.cycleStatus != null
                && (ctx.cycleStatus == CycleStatus.COMPLETED || ctx.cycleStatus == CycleStatus.ARCHIVED)) {
            Long annCycleId = a.getCycle() != null ? a.getCycle().getCycleId() : null;
            if (annCycleId == null || !annCycleId.equals(ctx.cycleId)) {
                return false;
            }
        }

        // Phase scope: FYP1 / FYP2.
        if ("FYP1".equals(scope) || "FYP2".equals(scope)) {
            if (ctx.cycleType == null) return false;
            // Supervisor-side phase scope still requires the supervisor pairing.
            if (a.getCreatedBy() != null && a.getCreatedBy().getUserId() != null
                    && ctx.supervisorUserId != null
                    && Objects.equals(a.getCreatedBy().getUserId(), ctx.supervisorUserId)) {
                return scope.equalsIgnoreCase(ctx.cycleType);
            }
            // Prefer cycle-id matching when the announcement is pinned to a specific cycle;
            // fall back to cycleType for legacy rows with NULL cycle_id.
            Long annCycleId = a.getCycle() != null ? a.getCycle().getCycleId() : null;
            if (annCycleId != null) {
                return annCycleId.equals(ctx.cycleId);
            }
            return scope.equalsIgnoreCase(ctx.cycleType);
        }

        // Programme scope, e.g. PROGRAMME_CS / PROGRAMME_SE / PROGRAMME_DS / PROGRAMME_IT.
        if (scope.startsWith("PROGRAMME_")) {
            String code = scope.substring("PROGRAMME_".length());
            return matchesProgramme(code, ctx.programme, ctx.specialisation);
        }

        // Specific students — must be explicitly named in audiences.
        if ("SPECIFIC_STUDENTS".equals(scope)) {
            return a.getAudiences().stream()
                    .anyMatch(au -> au.getTargetStudent() != null
                            && Objects.equals(au.getTargetStudent().getUserId(), ctx.userId));
        }

        // Unknown scope — be conservative, hide it.
        log.debug("Unrecognised announcement scope '{}' on id={} — hiding from student {}",
                scope, a.getAnnouncementId(), ctx.userId);
        return false;
    }

    private boolean matchesProgramme(String code, String programme, String specialisation) {
        if (code == null) return false;
        String c = code.toUpperCase(Locale.ROOT);
        String p = programme == null ? "" : programme.toUpperCase(Locale.ROOT);
        String s = specialisation == null ? "" : specialisation.toUpperCase(Locale.ROOT);
        return switch (c) {
            case "CS" -> p.contains("COMPUTER SCIENCE");
            case "SE" -> s.contains("SOFTWARE ENGINEERING");
            case "DS" -> s.contains("DATA SCIENCE");
            case "IT" -> p.contains("INFORMATION TECHNOLOGY");
            case "IS" -> s.contains("INFORMATION SYSTEMS");
            case "CYB" -> s.contains("CYBERSECURITY");
            case "GAME", "GAMEDEV" -> s.contains("GAME");
            default -> p.contains(c) || s.contains(c);
        };
    }

    // ---------- Student context ----------

    private StudentContext loadStudentContext(Long userId) {
        StudentContext ctx = new StudentContext();
        ctx.userId = userId;
        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(userId);
        if (projectOpt.isPresent()) {
            Project p = projectOpt.get();
            FypCycle cycle = p.getCycle();
            if (cycle != null) {
                ctx.cycleId = cycle.getCycleId();
                ctx.cycleType = cycle.getCycleType();
                ctx.cycleStatus = cycle.getStatus();
            }
            if (p.getSupervisor() != null) {
                ctx.supervisorUserId = p.getSupervisor().getUserId();
            }
        }
        StudentProfile profile = studentProfileRepository.findById(userId).orElse(null);
        if (profile != null) {
            ctx.programme = profile.getProgramme();
            ctx.specialisation = profile.getSpecialisation();
        }
        return ctx;
    }

    private static class StudentContext {
        Long userId;
        Long cycleId;
        String cycleType;          // FYP1 / FYP2
        CycleStatus cycleStatus;
        Long supervisorUserId;
        String programme;
        String specialisation;
    }

    // ---------- Helpers ----------

    private static String optString(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : v.toString();
    }

    private static String optString(Map<String, Object> m, String key, String fallback) {
        String v = optString(m, key);
        return (v == null || v.isBlank()) ? fallback : v;
    }

    private static String requireString(Map<String, Object> m, String key) {
        String v = optString(m, key);
        if (v == null || v.isBlank()) {
            throw new BadRequestException("Missing required field: " + key);
        }
        return v;
    }

    private static Long parseLong(Object o) {
        if (o == null) return null;
        try {
            if (o instanceof Number n) return n.longValue();
            return Long.parseLong(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Extra helper for callers that want to know about the stale list size.
    @SuppressWarnings("unused")
    private List<Project> activeProjectsBySupervisor(Long supervisorId) {
        return projectRepository.findActiveCycleBySupervisor(supervisorId);
    }
}
