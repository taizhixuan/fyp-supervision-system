package com.fyp.supervision.service;

import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.MeetingLogStatus;
import com.fyp.supervision.exception.BadRequestException;
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

        long existingLogs = meetingLogRepository.countByStudent_UserId(userId);
        String fypPhase = meetingLogRepository.findFirstByStudent_UserIdOrderByCreatedAtDesc(userId)
                .map(MeetingLog::getFypPhase)
                .filter(p -> p != null && !p.isBlank())
                .orElseGet(() -> {
                    String stage = project.getStage();
                    return (stage != null && (stage.equalsIgnoreCase("FYP2") || stage.equalsIgnoreCase("FYP 2"))) ? "FYP2" : "FYP1";
                });

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

    public Page<MeetingLog> getStudentLogs(Long userId, String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return meetingLogRepository.findByStudent_UserIdAndStatusOrderByCreatedAtDesc(
                    userId, MeetingLogStatus.valueOf(status), pageable);
        }
        return meetingLogRepository.findByStudent_UserIdOrderByCreatedAtDesc(userId, pageable);
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

        if (data.containsKey("meetingDate")) log.setMeetingDate(LocalDate.parse(data.get("meetingDate").toString()));
        if (data.containsKey("meetingNumber")) log.setMeetingNumber(((Number) data.get("meetingNumber")).intValue());
        if (data.containsKey("meetingMode")) log.setMeetingMode(data.get("meetingMode").toString());
        if (data.containsKey("fypPhase")) log.setFypPhase(data.get("fypPhase").toString());
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

        // Determine expected status for signing
        if (role.equals("SUPERVISOR") && log.getStatus() != MeetingLogStatus.SUBMITTED) {
            throw new BadRequestException("Supervisor can only sign submitted logs.");
        }
        if (role.equals("STUDENT") && log.getStatus() != MeetingLogStatus.SUPERVISOR_SIGNED) {
            throw new BadRequestException("Student can only sign after supervisor has signed.");
        }

        MeetingLogSignature signature = MeetingLogSignature.builder()
                .meetingLog(log)
                .signer(signer)
                .signerRole(role)
                .signatureImageUrl((String) data.get("signatureImageDataUrl"))
                .signatureSha256((String) data.get("signatureSha256"))
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
        }

        return meetingLogRepository.save(log);
    }

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
}
