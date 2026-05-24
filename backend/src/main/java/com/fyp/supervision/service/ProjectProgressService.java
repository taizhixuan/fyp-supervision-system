package com.fyp.supervision.service;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.enums.ProposalStatus;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectProgressService {

    public record ProjectRisk(String level, List<String> factors) {}

    private static final int CONDUCTED_TARGET = 8;
    private static final int LOG_TARGET = 6;

    private final ProposalRepository proposalRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogComplianceService meetingLogComplianceService;

    /** Composite 30/40/20/10 weighting documented in the spec. Returns 0..100. */
    public int progressFor(Project project) {
        if (project == null || project.getStudent() == null) return 0;
        Long studentId = project.getStudent().getUserId();
        String phase = phaseOf(project);

        int proposalScore = scoreProposal(studentId);
        int logScore = scoreMeetingLogs(studentId, phase);
        int conductedScore = scoreConducted(project.getProjectId());
        int timeScore = scoreTime(project);

        double weighted = 0.30 * proposalScore
                + 0.40 * logScore
                + 0.20 * conductedScore
                + 0.10 * timeScore;
        return (int) Math.round(weighted);
    }

    /** Rule-based risk. Returns LOW with empty factors for past cycles. */
    public ProjectRisk riskFor(Project project) {
        if (project == null) return new ProjectRisk("LOW", List.of());

        if (project.getCycle() != null && project.getCycle().getStatus() != null) {
            String s = project.getCycle().getStatus().name();
            if ("COMPLETED".equals(s) || "ARCHIVED".equals(s)) {
                return new ProjectRisk("LOW", List.of());
            }
        }

        List<String> factors = new ArrayList<>();
        Long studentId = project.getStudent() != null ? project.getStudent().getUserId() : null;
        boolean unpaired = project.getSupervisor() == null;
        long daysIn = daysSinceCycleStart(project);
        long cycleDuration = cycleDuration(project);
        int requiredByNow = cycleDuration > 0
                ? (int) Math.max(0, Math.round((double) LOG_TARGET * daysIn / cycleDuration))
                : 0;

        ProposalStatus proposalStatus = studentId != null
                ? proposalRepository.findByStudent_UserId(studentId)
                        .map(p -> p.getStatus()).orElse(null)
                : null;

        if (unpaired && daysIn > 30) {
            factors.add("Unpaired 30+ days into cycle");
        }
        if (proposalStatus == ProposalStatus.REJECTED) {
            factors.add("Proposal rejected");
        }
        if ((proposalStatus == null || proposalStatus == ProposalStatus.DRAFT) && daysIn > 30) {
            factors.add("Proposal not yet submitted");
        }

        int lockedLogs = studentId != null
                ? meetingLogComplianceService.completedLogCount(studentId, phaseOf(project))
                : 0;
        boolean veryBehindLogs = false;
        if (daysIn > 30 && lockedLogs < (requiredByNow / 2)) {
            factors.add("Behind on meeting logs (" + lockedLogs + " of expected " + requiredByNow + ")");
            if (daysIn > 60) veryBehindLogs = true;
        }

        java.util.Optional<LocalDateTime> lastConducted = meetingRepository
                .findMaxConfirmedStartAtByProjectAndStatus(project.getProjectId(), MeetingStatus.COMPLETED);
        if (lastConducted.isEmpty() && daysIn > 21) {
            factors.add("No meetings conducted yet");
        } else if (lastConducted.isPresent()) {
            long daysSince = ChronoUnit.DAYS.between(lastConducted.get().toLocalDate(), LocalDate.now());
            if (daysSince > 21) {
                factors.add("No conducted meeting in " + daysSince + " days");
            }
        }

        boolean high = (unpaired && daysIn > 30)
                || proposalStatus == ProposalStatus.REJECTED
                || veryBehindLogs;
        String level = high ? "HIGH" : (factors.isEmpty() ? "LOW" : "MEDIUM");
        return new ProjectRisk(level, factors);
    }

    // ===== helpers =====

    private String phaseOf(Project project) {
        String stage = project.getStage();
        if (stage != null && (stage.equalsIgnoreCase("FYP2") || stage.equalsIgnoreCase("FYP 2"))) {
            return "FYP2";
        }
        return "FYP1";
    }

    private int scoreProposal(Long studentId) {
        if (studentId == null) return 0;
        return proposalRepository.findByStudent_UserId(studentId)
                .map(p -> switch (p.getStatus()) {
                    case DRAFT -> 0;
                    case SUBMITTED -> 33;
                    case UNDER_REVIEW -> 50;
                    case REVISION_REQUIRED -> 50;
                    case REJECTED -> 20;
                    case APPROVED -> 100;
                })
                .orElse(0);
    }

    private int scoreMeetingLogs(Long studentId, String phase) {
        int logs = meetingLogComplianceService.completedLogCount(studentId, phase);
        return Math.min(100, (int) Math.round(((double) logs / LOG_TARGET) * 100));
    }

    private int scoreConducted(Long projectId) {
        long count = meetingRepository.countByProject_ProjectIdAndStatus(projectId, MeetingStatus.COMPLETED);
        return Math.min(100, (int) Math.round(((double) count / CONDUCTED_TARGET) * 100));
    }

    private int scoreTime(Project project) {
        if (project.getCycle() == null) return 0;
        LocalDate start = project.getCycle().getStartDate();
        LocalDate end = project.getCycle().getEndDate();
        if (start == null || end == null) return 0;
        LocalDate today = LocalDate.now();
        long total = ChronoUnit.DAYS.between(start, end);
        if (total <= 0) return 100;
        long elapsed = ChronoUnit.DAYS.between(start, today);
        long pct = Math.round(((double) elapsed / total) * 100);
        return (int) Math.max(0, Math.min(100, pct));
    }

    private long daysSinceCycleStart(Project project) {
        if (project.getCycle() == null || project.getCycle().getStartDate() == null) return 0;
        return ChronoUnit.DAYS.between(project.getCycle().getStartDate(), LocalDate.now());
    }

    private long cycleDuration(Project project) {
        if (project.getCycle() == null || project.getCycle().getStartDate() == null
                || project.getCycle().getEndDate() == null) return 0;
        return ChronoUnit.DAYS.between(project.getCycle().getStartDate(), project.getCycle().getEndDate());
    }
}
