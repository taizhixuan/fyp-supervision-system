package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.enums.ProjectStatus;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Single source of truth for "active cycle" lookups and student-to-cycle attachment.
 *
 * <p>The intended invariant is: at most ONE ACTIVE cycle per cycleType (FYP1, FYP2).
 * When a cycle is activated, any other cycle of the same type that was ACTIVE is moved
 * to COMPLETED. When an FYP1 cycle becomes ACTIVE, every existing ACTIVE student who
 * has no Project row yet gets a placeholder Project attached to it. Newly-registered
 * (or newly-approved) students are attached on the spot.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CycleLifecycleService {

    private static final String PENDING_PROJECT_TITLE = "(Pending — awaiting supervisor)";

    private final FypCycleRepository cycleRepository;
    private final ProjectRepository projectRepository;
    private final UserAccountRepository userAccountRepository;
    private final DeadlineRepository deadlineRepository;
    private final NotificationService notificationService;

    public Optional<FypCycle> findActiveCycle(String cycleType) {
        if (cycleType == null) return Optional.empty();
        return cycleRepository.findFirstByCycleTypeAndStatusOrderByStartDateDesc(cycleType, CycleStatus.ACTIVE);
    }

    public Optional<FypCycle> findActiveFyp1() {
        return findActiveCycle("FYP1");
    }

    /**
     * Idempotently attach a student to the currently-active FYP1 cycle by creating a
     * placeholder Project (no supervisor, default placeholder title). Safe to call from
     * registration, admin approval, and roster auto-approval. Does nothing if:
     *   - the user isn't an active student
     *   - no FYP1 cycle is active
     *   - the student already has a Project row
     *
     * <p>Uses REQUIRES_NEW so a placeholder save failure cannot mark the caller's
     * transaction (registration, approval, roster import) as rollback-only — those
     * paths must still commit even if cycle-attach fails. The placeholder also gets a
     * non-null title so deployments where project_title is still NOT NULL don't trip a
     * constraint violation.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<Project> attachStudentToActiveFyp1(UserAccount student) {
        if (student == null
                || student.getRole() != UserRole.STUDENT
                || student.getStatus() != UserStatus.ACTIVE) {
            return Optional.empty();
        }
        if (projectRepository.findByStudent_UserId(student.getUserId()).isPresent()) {
            return Optional.empty();
        }
        Optional<FypCycle> active = findActiveFyp1();
        if (active.isEmpty()) {
            return Optional.empty();
        }
        return savePlaceholder(active.get(), student);
    }

    /**
     * Backfill placeholders for every active student who is missing a Project, when an
     * FYP1 cycle is being activated. Returns the count attached. Skips students who
     * already have any Project so this is safe to re-run.
     *
     * <p>Uses REQUIRES_NEW so a per-row failure (e.g. unique-constraint hit) cannot
     * poison the caller's activate transaction — even if every save fails, the cycle's
     * status update still commits. Must be called via the Spring proxy (i.e. from a
     * different bean) for REQUIRES_NEW to take effect.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int backfillFyp1Placeholders(FypCycle cycle) {
        if (cycle == null || !"FYP1".equalsIgnoreCase(cycle.getCycleType())) return 0;
        if (cycle.getStatus() != CycleStatus.ACTIVE) return 0;
        List<UserAccount> students = userAccountRepository.findByRoleAndStatus(UserRole.STUDENT, UserStatus.ACTIVE);
        int count = 0;
        for (UserAccount student : students) {
            var existing = projectRepository.findByStudent_UserId(student.getUserId());
            if (existing.isPresent()) {
                // Re-attach stale placeholders pointing to a finished cycle. A placeholder
                // is identified by no supervisor — actual paired projects are left alone
                // (those students may be repeating or in transition; admin handles them).
                Project p = existing.get();
                FypCycle oldCycle = p.getCycle();
                boolean stalePlaceholder = p.getSupervisor() == null
                        && oldCycle != null
                        && (oldCycle.getStatus() == CycleStatus.COMPLETED
                                || oldCycle.getStatus() == CycleStatus.ARCHIVED);
                if (stalePlaceholder) {
                    p.setCycle(cycle);
                    p.setStage("FYP1");
                    p.setRegisteredAt(LocalDateTime.now());
                    try {
                        projectRepository.save(p);
                        count++;
                    } catch (Exception e) {
                        log.warn("Failed to re-attach stale placeholder for student {}: {}",
                                student.getUserId(), e.getMessage());
                    }
                }
                continue;
            }
            if (savePlaceholder(cycle, student).isPresent()) count++;
        }
        return count;
    }

    /**
     * Atomic status flip via direct UPDATE — no entity load, no dirty checking, no flush.
     * Eliminates a class of commit-time failures that can occur when an entity loaded in
     * the same session has unrelated lazy-loading or constraint problems.
     */
    @Transactional
    public void setCycleStatus(Long cycleId, CycleStatus newStatus) {
        int updated = cycleRepository.updateStatusById(cycleId, newStatus);
        if (updated == 0) {
            throw new IllegalStateException("Cycle " + cycleId + " not found for status update.");
        }
        if (newStatus == CycleStatus.COMPLETED || newStatus == CycleStatus.ARCHIVED) {
            notifyEnrolledStudents(cycleId, newStatus);
        }
    }

    /**
     * In-app notification to every student enrolled in the cycle that has just been
     * COMPLETED or ARCHIVED, so they understand why their write actions are now blocked.
     * Best-effort — a notification failure must not roll back the status change.
     */
    private void notifyEnrolledStudents(Long cycleId, CycleStatus newStatus) {
        List<Project> enrolled = projectRepository.findAllByCycleId(cycleId,
                org.springframework.data.domain.PageRequest.of(0, 500)).getContent();
        String title = newStatus == CycleStatus.COMPLETED
                ? "Your FYP cycle is now complete"
                : "Your FYP cycle has been archived";
        String message = newStatus == CycleStatus.COMPLETED
                ? "The FYP cycle you were enrolled in has been marked as completed. You now have read-only access to your records."
                : "The FYP cycle you were enrolled in has been archived. You now have read-only access to your records.";
        for (Project p : enrolled) {
            UserAccount student = p.getStudent();
            if (student == null) continue;
            try {
                notificationService.createNotification(
                        student.getUserId(),
                        "CYCLE_STATUS",
                        title,
                        message,
                        "/student/dashboard");
            } catch (Exception e) {
                log.warn("Cycle-status notification skipped for student {}: {}", student.getUserId(), e.getMessage());
            }
        }
    }

    /**
     * Atomic activate: deactivate any other ACTIVE cycle of the same type, then set this
     * one to ACTIVE — both via direct UPDATE statements.
     */
    @Transactional
    public void activateCycleAtomically(Long cycleId, String cycleType) {
        if (cycleType != null) {
            int demoted = cycleRepository.reassignStatusForType(
                    cycleType, CycleStatus.ACTIVE, CycleStatus.COMPLETED, cycleId);
            if (demoted > 0) {
                log.info("Demoted {} previously-active {} cycle(s) before activating {}", demoted, cycleType, cycleId);
            }
        }
        setCycleStatus(cycleId, CycleStatus.ACTIVE);
    }

    /**
     * Atomic delete: bulk-delete deadlines first (CASCADE handles deadline_reminder_log),
     * then delete the cycle row. Project FK is checked beforehand by the caller.
     */
    @Transactional
    public void deleteCycleAtomically(Long cycleId) {
        int deadlines = deadlineRepository.deleteAllByCycleId(cycleId);
        log.info("Deleting cycle {}: removed {} deadlines", cycleId, deadlines);
        int removed = cycleRepository.deleteByIdDirect(cycleId);
        if (removed == 0) {
            throw new IllegalStateException("Cycle " + cycleId + " not found for delete.");
        }
    }

    private Optional<Project> savePlaceholder(FypCycle cycle, UserAccount student) {
        Project project = Project.builder()
                .cycle(cycle)
                .student(student)
                .projectTitle(PENDING_PROJECT_TITLE)
                .stage("FYP1")
                .status(ProjectStatus.ACTIVE)
                .registeredAt(LocalDateTime.now())
                .build();
        try {
            return Optional.of(projectRepository.save(project));
        } catch (Exception e) {
            log.warn("Failed to attach student {} to FYP1 cycle: {}", student.getUserId(), e.getMessage());
            return projectRepository.findByStudent_UserId(student.getUserId());
        }
    }
}
