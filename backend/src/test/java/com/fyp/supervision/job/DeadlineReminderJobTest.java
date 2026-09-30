package com.fyp.supervision.job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.entity.DeadlineReminderLog;
import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.repository.DeadlineReminderLogRepository;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.NotificationService;
import com.fyp.supervision.service.SystemParameterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeadlineReminderJobTest {

    @Mock DeadlineRepository deadlineRepository;
    @Mock DeadlineReminderLogRepository reminderLogRepository;
    @Mock UserAccountRepository userAccountRepository;
    @Mock ProjectRepository projectRepository;
    @Mock NotificationService notificationService;
    @Mock SystemParameterService systemParameters;

    DeadlineReminderJob job;

    private final LocalDate due = LocalDate.of(2026, 10, 20);
    private Deadline deadline;

    @BeforeEach
    void setUp() {
        job = new DeadlineReminderJob(deadlineRepository, reminderLogRepository, userAccountRepository,
                projectRepository, notificationService, systemParameters, new ObjectMapper());

        FypCycle cycle = new FypCycle();
        cycle.setCycleId(3L);
        cycle.setCycleType("FYP1");
        deadline = Deadline.builder()
                .deadlineId(50L).cycle(cycle).title("Proposal").dueDate(due)
                .audience("STUDENT").reminderDays("[7,1]").build();

        UserAccount student = new UserAccount();
        student.setUserId(101L);
        student.setRole(UserRole.STUDENT);
        Project project = new Project();
        project.setStudent(student);
        project.setStage("FYP1");

        when(deadlineRepository.findUpcomingByEffectiveDate(any())).thenReturn(List.of(deadline));
        when(projectRepository.findForDeadlineAudience(3L)).thenReturn(List.of(project));
        when(userAccountRepository.findByUserIdIn(any())).thenReturn(List.of(student));
    }

    @Test
    void firesOnTheTriggerDay() {
        assertEquals(1, job.run(due.minusDays(7)));
        verify(notificationService).createNotification(eq(101L), eq("DEADLINE"), anyString(),
                eq("Due in 7 days: Proposal"), anyString());
    }

    @Test
    void missedRunCatchesUpWithTheRealDaysLeft() {
        // The day-7 run was missed; three days later the reminder still goes out, with
        // the actual time remaining rather than the stale "7 days".
        assertEquals(1, job.run(due.minusDays(4)));
        verify(notificationService).createNotification(eq(101L), eq("DEADLINE"), anyString(),
                eq("Due in 4 days: Proposal"), anyString());
    }

    @Test
    void severalOverdueRemindersSendOnlyTheLatest() {
        // Both the 7-day and 1-day reminders are overdue on the due date: send one message,
        // record both so neither fires again.
        assertEquals(1, job.run(due));
        verify(notificationService, times(1)).createNotification(anyLong(), anyString(), anyString(),
                eq("Due today: Proposal"), anyString());
        ArgumentCaptor<DeadlineReminderLog> logged = ArgumentCaptor.forClass(DeadlineReminderLog.class);
        verify(reminderLogRepository, times(2)).save(logged.capture());
        assertTrue(logged.getAllValues().stream().map(DeadlineReminderLog::getDaysBefore).toList()
                .containsAll(List.of(7, 1)));
    }

    @Test
    void alreadyFiredReminderIsNotRepeated() {
        when(reminderLogRepository.existsByDeadlineIdAndDaysBefore(50L, 7)).thenReturn(true);
        assertEquals(0, job.run(due.minusDays(5)));
        verify(notificationService, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void audienceIsScopedToTheDeadlinesCycle() {
        job.run(due.minusDays(7));
        verify(projectRepository).findForDeadlineAudience(3L);
        verify(projectRepository, never()).findAll();
    }
}
