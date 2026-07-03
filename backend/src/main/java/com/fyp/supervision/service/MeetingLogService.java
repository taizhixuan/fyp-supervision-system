package com.fyp.supervision.service;

import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.MeetingLogStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MeetingLogService {

    private final MeetingLogRepository meetingLogRepository;
    private final MeetingLogSignatureRepository signatureRepository;
    private final ProjectRepository projectRepository;
    private final UserAccountRepository userAccountRepository;
    private final MeetingRepository meetingRepository;
    private final NotificationService notificationService;

    /**
     * Returns auto-fill values for the meeting-log create form. When meetingId is provided,
     * also returns date/mode derived from that confirmed meeting.
     */
    public Map<String, Object> getPrefillData(Long userId, Long meetingId) {
        Project project = projectRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new BadRequestException("No active project found."));

        // Phase comes from project.stage (Model A: single project advances FYP1→FYP2).
        String stage = project.getStage();
        String fypPhase = (stage != null && (stage.equalsIgnoreCase("FYP2") || stage.equalsIgnoreCase("FYP 2"))) ? "FYP2" : "FYP1";

        // Count logs scoped to current phase so meeting numbering resets at FYP2 boundary.
        long existingLogs = meetingLogRepository.countByStudent_UserIdAndFypPhase(userId, fypPhase);

        Map<String, Object> result = new HashMap<>();
        result.put("meetingNumber", (int) existingLogs + 1);
        result.put("projectTitle", project.getProjectTitle());
        result.put("fypPhase", fypPhase);

        if (meetingId != null) {
            Meeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
            if (!meeting.getProject().getProjectId().equals(project.getProjectId())) {
                throw new BadRequestException("Meeting does not belong to your project.");
            }
            LocalDateTime when = meeting.getConfirmedStartAt() != null ? meeting.getConfirmedStartAt() : meeting.getProposedStartAt();
            result.put("meetingDate", when != null ? when.toLocalDate().toString() : null);
            String platform = meeting.getPlatform();
            // Map platform → meeting mode. Anything in-person/empty → PHYSICAL, else ONLINE.
            boolean isOnline = platform != null && !platform.isBlank() && !platform.equalsIgnoreCase("IN_PERSON") && !platform.equalsIgnoreCase("PHYSICAL");
            result.put("meetingMode", isOnline ? "ONLINE" : "PHYSICAL");
            result.put("meetingId", meetingId);
        }

        return result;
    }

    public Page<MeetingLog> getStudentLogs(Long userId, String status, String phase, Pageable pageable) {
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasPhase = phase != null && !phase.isBlank();
        if (hasStatus && hasPhase) {
            return meetingLogRepository.findByStudent_UserIdAndStatusAndFypPhaseOrderByCreatedAtDesc(
                    userId, MeetingLogStatus.valueOf(status), phase, pageable);
        }
        if (hasStatus) {
            return meetingLogRepository.findByStudent_UserIdAndStatusOrderByCreatedAtDesc(
                    userId, MeetingLogStatus.valueOf(status), pageable);
        }
        if (hasPhase) {
            return meetingLogRepository.findByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc(userId, phase, pageable);
        }
        return meetingLogRepository.findByStudent_UserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /** Backwards-compat overload (no phase filter). */
    public Page<MeetingLog> getStudentLogs(Long userId, String status, Pageable pageable) {
        return getStudentLogs(userId, status, null, pageable);
    }

    public MeetingLog getLog(Long logId) {
        return meetingLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting log not found"));
    }

    @Transactional
    public MeetingLog createLog(Long userId, Map<String, Object> data) {
        Project project = projectRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new BadRequestException("No project found. You need an active project to create meeting logs."));

        Meeting linkedMeeting = null;
        Object meetingIdRaw = data.get("meetingId");
        if (meetingIdRaw != null && !meetingIdRaw.toString().isBlank()) {
            Long meetingId = meetingIdRaw instanceof Number
                    ? ((Number) meetingIdRaw).longValue()
                    : Long.parseLong(meetingIdRaw.toString());
            linkedMeeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
            if (!linkedMeeting.getProject().getProjectId().equals(project.getProjectId())) {
                throw new BadRequestException("Meeting does not belong to your project.");
            }
        }

        MeetingLog log = MeetingLog.builder()
                .project(project)
                .student(project.getStudent())
                .supervisor(project.getSupervisor())
                .meeting(linkedMeeting)
                .meetingDate(data.get("meetingDate") != null ? LocalDate.parse(data.get("meetingDate").toString()) : LocalDate.now())
                .meetingNumber(data.get("meetingNumber") != null ? ((Number) data.get("meetingNumber")).intValue() : 1)
                .meetingMode(data.get("meetingMode") != null ? data.get("meetingMode").toString() : "PHYSICAL")
                .fypPhase(data.get("fypPhase") != null ? data.get("fypPhase").toString() : "FYP1")
                .tasksJson(toJson(data.get("tasks")))
                .workDoneDetails((String) data.get("workDoneDetails"))
                .workToBeDone((String) data.get("workToBeDone"))
                .problemsAndSolutions((String) data.get("problemsAndSolutions"))
                .status(MeetingLogStatus.DRAFT)
                .build();

        return meetingLogRepository.save(log);
    }

    @Transactional
    public MeetingLog updateLog(Long logId, Long userId, Map<String, Object> data) {
        MeetingLog log = getLog(logId);
        if (!log.getStudent().getUserId().equals(userId)) {
            throw new BadRequestException("You can only edit your own logs.");
        }
        if (log.getStatus() != MeetingLogStatus.DRAFT && log.getStatus() != MeetingLogStatus.CORRECTION_REQUIRED) {
            throw new BadRequestException("Log cannot be edited in its current status.");
        }

        if (data.get("meetingDate") != null) log.setMeetingDate(LocalDate.parse(data.get("meetingDate").toString()));
        if (data.get("meetingNumber") instanceof Number n) log.setMeetingNumber(n.intValue());
        if (data.get("meetingMode") != null) log.setMeetingMode(data.get("meetingMode").toString());
        if (data.get("fypPhase") != null) log.setFypPhase(data.get("fypPhase").toString());
        if (data.containsKey("tasks")) log.setTasksJson(toJson(data.get("tasks")));
        if (data.containsKey("workDoneDetails")) log.setWorkDoneDetails((String) data.get("workDoneDetails"));
        if (data.containsKey("workToBeDone")) log.setWorkToBeDone((String) data.get("workToBeDone"));
        if (data.containsKey("problemsAndSolutions")) log.setProblemsAndSolutions((String) data.get("problemsAndSolutions"));

        if (log.getStatus() == MeetingLogStatus.CORRECTION_REQUIRED) {
            log.setStatus(MeetingLogStatus.DRAFT);
            log.setCorrectionReason(null);
        }

        return meetingLogRepository.save(log);
    }

    @Transactional
    public MeetingLog submitLog(Long logId, Long userId) {
        MeetingLog log = getLog(logId);
        if (!log.getStudent().getUserId().equals(userId)) {
            throw new BadRequestException("You can only submit your own logs.");
        }
        if (log.getStatus() != MeetingLogStatus.DRAFT && log.getStatus() != MeetingLogStatus.CORRECTION_REQUIRED) {
            throw new BadRequestException("Log cannot be submitted in its current status.");
        }

        log.setStatus(MeetingLogStatus.SUBMITTED);
        log.setSubmittedAt(LocalDateTime.now());
        MeetingLog saved = meetingLogRepository.save(log);

        notificationService.createNotification(
                log.getSupervisor().getUserId(), "MEETING",
                "Meeting Log Submitted",
                log.getStudent().getFullName() + " has submitted meeting log #" + log.getMeetingNumber() + " for review.",
                "/supervisor/meeting-logs"
        );

        return saved;
    }

    @Transactional
    public MeetingLog signLog(Long logId, Long userId, Map<String, Object> data) {
        MeetingLog log = getLog(logId);
        UserAccount signer = userAccountRepository.findById(userId).orElseThrow();
        String role = signer.getRole().name();

        // Ownership: a caller may only sign their own log, otherwise any supervisor or
        // student could forge a signature on another pair's log by guessing its id.
        if (role.equals("SUPERVISOR")) {
            if (log.getSupervisor() == null || !log.getSupervisor().getUserId().equals(userId)) {
                throw new ForbiddenException("You can only sign your own students' logs.");
            }
        } else if (role.equals("STUDENT")) {
            if (log.getStudent() == null || !log.getStudent().getUserId().equals(userId)) {
                throw new ForbiddenException("You can only sign your own logs.");
            }
        }

        // Determine expected status for signing
        if (role.equals("SUPERVISOR") && log.getStatus() != MeetingLogStatus.SUBMITTED) {
            throw new BadRequestException("Supervisor can only sign submitted logs.");
        }
        if (role.equals("STUDENT") && log.getStatus() != MeetingLogStatus.SUPERVISOR_SIGNED) {
            throw new BadRequestException("Student can only sign after supervisor has signed.");
        }

        String signatureImage = (String) data.get("signatureImageDataUrl");
        // Compute the SHA-256 of the signature image server-side rather than trusting the
        // client-supplied value, so the stored hash is a fingerprint we can vouch for and
        // print into the exported logbook. Fall back to the client value only if the image
        // can't be decoded (e.g. an externally stored reference instead of a data URL).
        String serverHash = sha256Hex(signatureImage);
        String signatureHash = serverHash != null ? serverHash : (String) data.get("signatureSha256");

        MeetingLogSignature signature = MeetingLogSignature.builder()
                .meetingLog(log)
                .signer(signer)
                .signerRole(role)
                .signatureImageUrl(signatureImage)
                .signatureSha256(signatureHash)
                .build();
        signatureRepository.save(signature);

        if (role.equals("SUPERVISOR")) {
            log.setStatus(MeetingLogStatus.SUPERVISOR_SIGNED);
            notificationService.createNotification(
                    log.getStudent().getUserId(), "MEETING",
                    "Meeting Log Signed by Supervisor",
                    "Your supervisor has signed meeting log #" + log.getMeetingNumber() + ". Please sign to complete it.",
                    "/student/meeting-logs"
            );
        } else if (role.equals("STUDENT")) {
            log.setStatus(MeetingLogStatus.LOCKED);
            log.setLockedAt(LocalDateTime.now());
            // Whole-document integrity: now that both parties have signed, freeze a SHA-256
            // over the entire log content plus both signature fingerprints. This extends
            // tamper-evidence from the signature image alone to the full record, and is
            // printed into the exported DOCX so a copy that leaves the system stays verifiable.
            var allSignatures = signatureRepository.findByMeetingLog_LogId(log.getLogId());
            log.setContentHash(computeContentHash(log, allSignatures));
        }

        return meetingLogRepository.save(log);
    }

    /**
     * One-time heal: fill {@code content_hash} for logs that locked before whole-document
     * hashing existed. Idempotent — only touches LOCKED logs whose hash is still null, so
     * it is safe to run on every startup and no-ops once the backlog is cleared.
     */
    @Transactional
    public int backfillMissingContentHashes() {
        var pending = meetingLogRepository.findByStatusAndContentHashIsNull(MeetingLogStatus.LOCKED);
        for (MeetingLog log : pending) {
            var sigs = signatureRepository.findByMeetingLog_LogId(log.getLogId());
            log.setContentHash(computeContentHash(log, sigs));
        }
        if (!pending.isEmpty()) meetingLogRepository.saveAll(pending);
        return pending.size();
    }

    /**
     * Canonical SHA-256 over the whole locked log: every content field plus both signature
     * fingerprints, joined in a fixed order. Rebuilding this string from the stored record
     * and re-hashing lets an exported logbook be verified as unaltered — not just its
     * signature images. Null fields normalise to empty so the digest is reproducible.
     */
    private String computeContentHash(MeetingLog log, java.util.List<MeetingLogSignature> signatures) {
        StringBuilder sb = new StringBuilder(512);
        sb.append("logId=").append(log.getLogId()).append('\n');
        sb.append("student=").append(log.getStudent() != null ? log.getStudent().getUserId() : "").append('\n');
        sb.append("supervisor=").append(log.getSupervisor() != null ? log.getSupervisor().getUserId() : "").append('\n');
        sb.append("meetingDate=").append(log.getMeetingDate()).append('\n');
        sb.append("meetingNumber=").append(log.getMeetingNumber()).append('\n');
        sb.append("meetingMode=").append(nz(log.getMeetingMode())).append('\n');
        sb.append("fypPhase=").append(nz(log.getFypPhase())).append('\n');
        sb.append("tasks=").append(nz(log.getTasksJson())).append('\n');
        sb.append("discussion=").append(nz(log.getDiscussionSummary())).append('\n');
        sb.append("workDone=").append(nz(log.getWorkDoneDetails())).append('\n');
        sb.append("workToDo=").append(nz(log.getWorkToBeDone())).append('\n');
        sb.append("problems=").append(nz(log.getProblemsAndSolutions())).append('\n');
        sb.append("actionItems=").append(nz(log.getActionItems())).append('\n');
        sb.append("nextMeetingDate=").append(log.getNextMeetingDate()).append('\n');
        sb.append("supervisorComments=").append(nz(log.getSupervisorComments())).append('\n');
        signatures.stream()
                .sorted(java.util.Comparator
                        .comparing((MeetingLogSignature s) -> nz(s.getSignerRole()))
                        .thenComparing(s -> s.getSigner() != null ? s.getSigner().getUserId() : 0L))
                .forEach(s -> sb.append("sig=").append(nz(s.getSignerRole()))
                        .append(':').append(nz(s.getSignatureSha256())).append('\n'));
        return sha256HexOfString(sb.toString());
    }

    /** SHA-256 (lowercase hex) of a UTF-8 string. */
    private String sha256HexOfString(String content) {
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            return null; // SHA-256 is guaranteed present on every standard JRE.
        }
    }

    private String nz(String s) { return s == null ? "" : s; }

    @Transactional
    public MeetingLog addSupervisorComments(Long logId, Long userId, String comments) {
        MeetingLog log = getLog(logId);
        if (!log.getSupervisor().getUserId().equals(userId)) {
            throw new BadRequestException("Only the assigned supervisor can add comments.");
        }
        log.setSupervisorComments(comments);
        return meetingLogRepository.save(log);
    }

    @Transactional
    public MeetingLog requestCorrection(Long logId, Long userId, String reason) {
        MeetingLog log = getLog(logId);
        if (!log.getSupervisor().getUserId().equals(userId)) {
            throw new BadRequestException("Only the assigned supervisor can request corrections.");
        }
        if (log.getStatus() != MeetingLogStatus.SUBMITTED) {
            throw new BadRequestException("Can only request corrections on submitted logs.");
        }
        log.setStatus(MeetingLogStatus.CORRECTION_REQUIRED);
        log.setCorrectionReason(reason);
        MeetingLog saved = meetingLogRepository.save(log);

        notificationService.createNotification(
                log.getStudent().getUserId(), "MEETING",
                "Meeting Log Correction Required",
                "Your supervisor has requested corrections on meeting log #" + log.getMeetingNumber() + ".",
                "/student/meeting-logs"
        );

        return saved;
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    /**
     * SHA-256 (lowercase hex) of the decoded signature image bytes. Accepts a data URL
     * ("data:image/png;base64,...") and hashes the raw image, so the fingerprint matches
     * exactly what is stored and embedded in the exported DOCX. Returns null when the
     * input can't be decoded into image bytes.
     */
    private String sha256Hex(String signatureImageDataUrl) {
        byte[] bytes = decodeImageBytes(signatureImageDataUrl);
        if (bytes == null || bytes.length == 0) return null;
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(64);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            return null; // SHA-256 is guaranteed present on every standard JRE.
        }
    }

    private byte[] decodeImageBytes(String url) {
        if (url == null || url.isBlank()) return null;
        String base64 = url.startsWith("data:") ? url.substring(url.indexOf(',') + 1) : url;
        try {
            return java.util.Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
