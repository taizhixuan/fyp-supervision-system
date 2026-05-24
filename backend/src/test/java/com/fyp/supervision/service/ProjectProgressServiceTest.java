package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.enums.ProposalStatus;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProposalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class ProjectProgressServiceTest {

    private ProposalRepository proposalRepository;
    private MeetingRepository meetingRepository;
    private MeetingLogComplianceService meetingLogComplianceService;
    private ProjectProgressService service;

    @BeforeEach
    void setUp() {
        proposalRepository = Mockito.mock(ProposalRepository.class);
        meetingRepository = Mockito.mock(MeetingRepository.class);
        meetingLogComplianceService = Mockito.mock(MeetingLogComplianceService.class);
        service = new ProjectProgressService(proposalRepository, meetingRepository, meetingLogComplianceService);
    }

    private Project sampleProject(Long projectId, Long studentId, boolean paired, String stage,
                                  LocalDate cycleStart, LocalDate cycleEnd, CycleStatus cycleStatus) {
        UserAccount student = UserAccount.builder().userId(studentId).build();
        UserAccount supervisor = paired ? UserAccount.builder().userId(99L).build() : null;
        FypCycle cycle = FypCycle.builder()
                .cycleId(1L).cycleCode("FYP1-T").cycleType("FYP1").academicYear("2024/2025")
                .startDate(cycleStart).endDate(cycleEnd).status(cycleStatus).build();
        return Project.builder()
                .projectId(projectId).cycle(cycle).student(student).supervisor(supervisor)
                .stage(stage).build();
    }

    @Test
    void progress_zero_when_nothing_done() {
        Project p = sampleProject(1L, 10L, true, "FYP1",
                LocalDate.now(), LocalDate.now().plusDays(120), CycleStatus.ACTIVE);
        when(proposalRepository.findByStudent_UserId(10L)).thenReturn(Optional.empty());
        when(meetingLogComplianceService.completedLogCount(eq(10L), any())).thenReturn(0);
        when(meetingRepository.countByProject_ProjectIdAndStatus(eq(1L), eq(MeetingStatus.COMPLETED))).thenReturn(0L);

        assertThat(service.progressFor(p)).isEqualTo(0);
    }

    @Test
    void progress_full_when_approved_six_logs_eight_meetings_full_cycle() {
        Project p = sampleProject(2L, 11L, true, "FYP1",
                LocalDate.now().minusDays(120), LocalDate.now(), CycleStatus.ACTIVE);
        Proposal proposal = Proposal.builder().status(ProposalStatus.APPROVED).build();
        when(proposalRepository.findByStudent_UserId(11L)).thenReturn(Optional.of(proposal));
        when(meetingLogComplianceService.completedLogCount(eq(11L), eq("FYP1"))).thenReturn(6);
        when(meetingRepository.countByProject_ProjectIdAndStatus(eq(2L), eq(MeetingStatus.COMPLETED))).thenReturn(8L);

        assertThat(service.progressFor(p)).isEqualTo(100);
    }

    @Test
    void risk_low_when_archived_cycle_regardless_of_signals() {
        Project p = sampleProject(3L, 12L, false, "FYP1",
                LocalDate.now().minusDays(200), LocalDate.now().minusDays(50), CycleStatus.COMPLETED);
        ProjectProgressService.ProjectRisk r = service.riskFor(p);
        assertThat(r.level()).isEqualTo("LOW");
        assertThat(r.factors()).isEmpty();
    }

    @Test
    void risk_high_when_unpaired_late_into_active_cycle() {
        Project p = sampleProject(4L, 13L, false, "FYP1",
                LocalDate.now().minusDays(45), LocalDate.now().plusDays(60), CycleStatus.ACTIVE);
        when(proposalRepository.findByStudent_UserId(13L)).thenReturn(Optional.empty());
        when(meetingLogComplianceService.completedLogCount(eq(13L), any())).thenReturn(0);
        when(meetingRepository.findMaxConfirmedStartAtByProjectAndStatus(eq(4L), eq(MeetingStatus.COMPLETED)))
                .thenReturn(Optional.empty());

        ProjectProgressService.ProjectRisk r = service.riskFor(p);
        assertThat(r.level()).isEqualTo("HIGH");
        assertThat(r.factors()).anyMatch(f -> f.startsWith("Unpaired 30+ days"));
    }

    @Test
    void risk_medium_when_no_recent_meeting_but_otherwise_okay() {
        Project p = sampleProject(5L, 14L, true, "FYP1",
                LocalDate.now().minusDays(45), LocalDate.now().plusDays(60), CycleStatus.ACTIVE);
        when(proposalRepository.findByStudent_UserId(14L))
                .thenReturn(Optional.of(Proposal.builder().status(ProposalStatus.APPROVED).build()));
        when(meetingLogComplianceService.completedLogCount(eq(14L), any())).thenReturn(3);
        when(meetingRepository.findMaxConfirmedStartAtByProjectAndStatus(eq(5L), eq(MeetingStatus.COMPLETED)))
                .thenReturn(Optional.of(LocalDateTime.now().minusDays(30)));

        ProjectProgressService.ProjectRisk r = service.riskFor(p);
        assertThat(r.level()).isEqualTo("MEDIUM");
        assertThat(r.factors()).anyMatch(f -> f.contains("No conducted meeting"));
    }
}
