package com.fyp.supervision.service;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingLogStatus;
import com.fyp.supervision.repository.MeetingLogRepository;
import com.fyp.supervision.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * When a supervisor marks a meeting COMPLETED, the student gets a DRAFT meeting log
 * pre-filled from the meeting: date, number, mode, phase, the supervisor's notes as
 * "work done" and the action items as "work to be done". The student still reviews,
 * edits and submits it, so nothing is signed on their behalf.
 *
 * The draft is written straight away from the raw notes. If an LLM is configured, an
 * async pass then rewrites the notes into a cleaner paragraph, but only while the
 * student has not touched the draft yet.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingLogDraftService {

    static final String AI_MARKER = "[Summarised from your supervisor's meeting notes. Please review.]\n\n";

    private final MeetingLogRepository meetingLogRepository;
    private final MeetingRepository meetingRepository;
    private final NotificationService notificationService;
    private final AiServiceClient aiServiceClient;

    /** Returns the new draft, or empty when the meeting already has a log. */
    @Transactional
    public Optional<MeetingLog> createDraftFromMeeting(Meeting meeting, List<String> actionItems) {
        Project project = meeting.getProject();
        if (project == null || project.getStudent() == null || project.getSupervisor() == null) {
            return Optional.empty();
        }
        if (meetingLogRepository.existsByMeeting_MeetingId(meeting.getMeetingId())) {
            return Optional.empty();
        }

        String phase = phaseOf(project);
        long existing = meetingLogRepository.countByStudent_UserIdAndFypPhase(project.getStudent().getUserId(), phase);
        LocalDateTime when = meeting.getConfirmedStartAt() != null ? meeting.getConfirmedStartAt() : meeting.getProposedStartAt();
        String platform = meeting.getPlatform();
        boolean online = platform != null && !platform.isBlank()
                && !platform.equalsIgnoreCase("IN_PERSON") && !platform.equalsIgnoreCase("PHYSICAL");

        String workDone = workDoneFromNotes(meeting);
        String workToBeDone = bullets(actionItems);

        MeetingLog draft = MeetingLog.builder()
                .project(project)
                .student(project.getStudent())
                .supervisor(project.getSupervisor())
                .meeting(meeting)
                .meetingDate(when != null ? when.toLocalDate() : LocalDate.now())
                .meetingNumber((int) existing + 1)
                .meetingMode(online ? "ONLINE" : "PHYSICAL")
                .fypPhase(phase)
                .workDoneDetails(workDone)
                .workToBeDone(workToBeDone)
                .discussionSummary(meeting.getNotes())
                .actionItems(workToBeDone)
                .status(MeetingLogStatus.DRAFT)
                .build();
        MeetingLog saved = meetingLogRepository.save(draft);

        notificationService.createNotification(project.getStudent().getUserId(), "MEETING_LOG",
                "Meeting log draft ready",
                "A draft log for \"" + (meeting.getTitle() != null ? meeting.getTitle() : "your meeting")
                        + "\" was filled in from the meeting. Review, edit and submit it.",
                "/student/meeting-logs/" + saved.getLogId());
        return Optional.of(saved);
    }

    /**
     * Best-effort LLM rewrite of the notes. Runs off the request thread. Skips silently if
     * the AI is off, returns nothing, or the student already edited the draft.
     */
    @Async
    public void enhanceWithAiSummary(Long logId, Long meetingId, List<String> actionItems) {
        try {
            MeetingLog draft = meetingLogRepository.findById(logId).orElse(null);
            Meeting meeting = meetingRepository.findById(meetingId).orElse(null);
            if (draft == null || meeting == null || meeting.getNotes() == null || meeting.getNotes().isBlank()) return;
            String original = draft.getWorkDoneDetails();

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("title", meeting.getTitle());
            payload.put("agenda", meeting.getAgenda());
            payload.put("notes", meeting.getNotes());
            payload.put("actionItems", actionItems);
            String summary = aiServiceClient.summarizeMeeting(payload);
            if (summary == null || summary.isBlank()) return;

            // Re-read: the student may have edited while the LLM was running.
            MeetingLog fresh = meetingLogRepository.findById(logId).orElse(null);
            if (fresh == null || fresh.getStatus() != MeetingLogStatus.DRAFT
                    || !Objects.equals(fresh.getWorkDoneDetails(), original)) {
                return;
            }
            fresh.setWorkDoneDetails(AI_MARKER + summary.trim());
            meetingLogRepository.save(fresh);
        } catch (Exception e) {
            log.warn("AI summary for meeting log {} skipped: {}", logId, e.getMessage());
        }
    }

    static String workDoneFromNotes(Meeting meeting) {
        StringBuilder sb = new StringBuilder();
        if (meeting.getNotes() != null && !meeting.getNotes().isBlank()) {
            sb.append(meeting.getNotes().trim());
        } else {
            sb.append("Discussed: ").append(meeting.getTitle() != null ? meeting.getTitle() : "project progress").append('.');
            if (meeting.getAgenda() != null && !meeting.getAgenda().isBlank()) {
                sb.append("\n\nAgenda:\n").append(meeting.getAgenda().trim());
            }
        }
        return sb.toString();
    }

    static String bullets(List<String> items) {
        if (items == null || items.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (String i : items) {
            if (i == null || i.isBlank()) continue;
            if (!sb.isEmpty()) sb.append('\n');
            sb.append("- ").append(i.trim());
        }
        return sb.toString();
    }

    private static String phaseOf(Project project) {
        String stage = project.getStage();
        return (stage != null && (stage.equalsIgnoreCase("FYP2") || stage.equalsIgnoreCase("FYP 2"))) ? "FYP2" : "FYP1";
    }
}
