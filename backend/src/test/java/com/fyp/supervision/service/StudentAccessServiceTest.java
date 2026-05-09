package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.repository.ProjectRepository;
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

    @InjectMocks
    StudentAccessService service;

    private Project projectWithCycleStatus(CycleStatus status) {
        FypCycle cycle = new FypCycle();
        cycle.setStatus(status);
        Project p = new Project();
        p.setCycle(cycle);
        return p;
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
