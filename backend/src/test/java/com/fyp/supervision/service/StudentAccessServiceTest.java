package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.ProposalRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentAccessServiceTest {

    @Mock
    ProjectRepository projectRepository;

    @Mock
    ProposalRepository proposalRepository;

    @InjectMocks
    StudentAccessService service;

    /** A paired (engaged) student's project in a cycle with the given status. */
    private Project projectWithCycleStatus(CycleStatus status) {
        FypCycle cycle = new FypCycle();
        cycle.setStatus(status);
        Project p = new Project();
        p.setCycle(cycle);
        p.setSupervisor(new UserAccount());
        return p;
    }

    @Test
    void isCycleActive_trueForUnpairedPlaceholderOnFinishedCycle() {
        // Never paired, no proposal: waiting for the next FYP1 backfill, so writes such as
        // sending a supervision request must still work (matches the dashboard's cycleActive).
        Project placeholder = projectWithCycleStatus(CycleStatus.COMPLETED);
        placeholder.setSupervisor(null);
        when(projectRepository.findByStudent_UserId(8L)).thenReturn(Optional.of(placeholder));
        when(proposalRepository.findByStudent_UserId(8L)).thenReturn(Optional.empty());
        assertThat(service.isCycleActive(8L)).isTrue();
    }

    @Test
    void isCycleActive_trueWhenStudentHasNoProject() {
        // Brand-new student before placeholder attach — write paths must still work.
        when(projectRepository.findByStudent_UserId(1L)).thenReturn(Optional.empty());
        assertThat(service.isCycleActive(1L)).isTrue();
    }

    @Test
    void isCycleActive_trueForActive() {
        when(projectRepository.findByStudent_UserId(2L))
                .thenReturn(Optional.of(projectWithCycleStatus(CycleStatus.ACTIVE)));
        assertThat(service.isCycleActive(2L)).isTrue();
    }

    @Test
    void isCycleActive_trueForPlanning() {
        when(projectRepository.findByStudent_UserId(3L))
                .thenReturn(Optional.of(projectWithCycleStatus(CycleStatus.PLANNING)));
        assertThat(service.isCycleActive(3L)).isTrue();
    }

    @Test
    void isCycleActive_falseForCompleted() {
        when(projectRepository.findByStudent_UserId(4L))
                .thenReturn(Optional.of(projectWithCycleStatus(CycleStatus.COMPLETED)));
        assertThat(service.isCycleActive(4L)).isFalse();
    }

    @Test
    void isCycleActive_falseForArchived() {
        when(projectRepository.findByStudent_UserId(5L))
                .thenReturn(Optional.of(projectWithCycleStatus(CycleStatus.ARCHIVED)));
        assertThat(service.isCycleActive(5L)).isFalse();
    }

    @Test
    void requireActiveCycle_throwsForbiddenWhenCycleEnded() {
        when(projectRepository.findByStudent_UserId(6L))
                .thenReturn(Optional.of(projectWithCycleStatus(CycleStatus.COMPLETED)));
        assertThatThrownBy(() -> service.requireActiveCycle(6L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("read-only");
    }

    @Test
    void requireActiveCycle_passesSilentlyWhenCycleActive() {
        when(projectRepository.findByStudent_UserId(7L))
                .thenReturn(Optional.of(projectWithCycleStatus(CycleStatus.ACTIVE)));
        assertThatCode(() -> service.requireActiveCycle(7L)).doesNotThrowAnyException();
    }
}
