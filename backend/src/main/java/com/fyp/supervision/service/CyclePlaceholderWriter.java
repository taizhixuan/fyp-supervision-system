package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.enums.ProjectStatus;
import com.fyp.supervision.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Writes a single student's FYP1 placeholder in its own transaction. Lives in a separate
 * bean (not inside {@link CycleLifecycleService}) so that {@code REQUIRES_NEW} actually
 * takes effect through the Spring proxy: when the batch backfill calls {@link #attachOne}
 * per student, each row gets a fresh persistence context, so one save failing rolls back
 * only that row instead of poisoning the whole backfill transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CyclePlaceholderWriter {

    static final String PENDING_PROJECT_TITLE = "(Pending — awaiting supervisor)";

    private final ProjectRepository projectRepository;

    /**
     * Attach one student to {@code cycle}: re-point a stale placeholder (no supervisor,
     * cycle COMPLETED/ARCHIVED) or create a fresh placeholder. Returns true if a row was
     * written. A DB failure throws out of its own transaction and is caught by the caller,
     * leaving other students unaffected.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean attachOne(FypCycle cycle, UserAccount student) {
        Optional<Project> existing = projectRepository.findByStudent_UserId(student.getUserId());
        if (existing.isPresent()) {
            Project p = existing.get();
            FypCycle oldCycle = p.getCycle();
            boolean stalePlaceholder = p.getSupervisor() == null
                    && oldCycle != null
                    && (oldCycle.getStatus() == CycleStatus.COMPLETED
                            || oldCycle.getStatus() == CycleStatus.ARCHIVED);
            if (!stalePlaceholder) {
                return false;
            }
            p.setCycle(cycle);
            p.setStage("FYP1");
            p.setRegisteredAt(LocalDateTime.now());
            projectRepository.saveAndFlush(p);
            return true;
        }

        Project project = Project.builder()
                .cycle(cycle)
                .student(student)
                .projectTitle(PENDING_PROJECT_TITLE)
                .stage("FYP1")
                .status(ProjectStatus.ACTIVE)
                .registeredAt(LocalDateTime.now())
                .build();
        projectRepository.saveAndFlush(project);
        return true;
    }
}
