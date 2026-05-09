package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CycleLifecycleServiceTest {

    @Mock FypCycleRepository cycleRepository;
    @Mock ProjectRepository projectRepository;
    @Mock UserAccountRepository userAccountRepository;
    @Mock DeadlineRepository deadlineRepository;
    @Mock NotificationService notificationService;

    @InjectMocks CycleLifecycleService service;

    private Project enrolledProject(long studentId) {
        UserAccount student = new UserAccount();
        student.setUserId(studentId);
        student.setFullName("student-" + studentId);
        Project p = new Project();
        p.setStudent(student);
        return p;
    }

    private void mockCycleUpdate(long cycleId, CycleStatus newStatus, int rowsAffected) {
        when(cycleRepository.updateStatusById(cycleId, newStatus)).thenReturn(rowsAffected);
    }

    @Test
    void setCycleStatus_completed_notifiesEveryEnrolledStudent() {
        long cycleId = 9L;
        mockCycleUpdate(cycleId, CycleStatus.COMPLETED, 1);
        Page<Project> enrolled = new PageImpl<>(List.of(enrolledProject(101L), enrolledProject(102L)));
        when(projectRepository.findAllByCycleId(eq(cycleId), any(Pageable.class))).thenReturn(enrolled);

        service.setCycleStatus(cycleId, CycleStatus.COMPLETED);

        verify(notificationService, times(2))
                .createNotification(any(Long.class), eq("CYCLE_STATUS"), anyString(), anyString(), anyString());
    }

    @Test
    void setCycleStatus_archived_alsoNotifies() {
        long cycleId = 10L;
        mockCycleUpdate(cycleId, CycleStatus.ARCHIVED, 1);
        Page<Project> enrolled = new PageImpl<>(List.of(enrolledProject(201L)));
        when(projectRepository.findAllByCycleId(eq(cycleId), any(Pageable.class))).thenReturn(enrolled);

        service.setCycleStatus(cycleId, CycleStatus.ARCHIVED);

        verify(notificationService, times(1))
                .createNotification(eq(201L), eq("CYCLE_STATUS"), anyString(), anyString(), anyString());
    }

    @Test
    void setCycleStatus_active_doesNotNotify() {
        long cycleId = 11L;
        mockCycleUpdate(cycleId, CycleStatus.ACTIVE, 1);

        service.setCycleStatus(cycleId, CycleStatus.ACTIVE);

        verify(notificationService, never())
                .createNotification(any(Long.class), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void activateCycleAtomically_demotesPriorActiveOfSameType() {
        long cycleId = 5L;
        when(cycleRepository.reassignStatusForType(
                "FYP1", CycleStatus.ACTIVE, CycleStatus.COMPLETED, cycleId))
                .thenReturn(1);
        // setCycleStatus call inside activate
        mockCycleUpdate(cycleId, CycleStatus.ACTIVE, 1);

        service.activateCycleAtomically(cycleId, "FYP1");

        verify(cycleRepository).reassignStatusForType(
                "FYP1", CycleStatus.ACTIVE, CycleStatus.COMPLETED, cycleId);
        verify(cycleRepository).updateStatusById(cycleId, CycleStatus.ACTIVE);
    }
}
