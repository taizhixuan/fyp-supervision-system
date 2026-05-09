package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Read-only enforcement helper. A student whose enrolled cycle has been COMPLETED or
 * ARCHIVED can still log in and view their dashboard / past records, but every write
 * endpoint must call {@link #requireActiveCycle} so we don't accept new edits.
 */
@Service
@RequiredArgsConstructor
public class StudentAccessService {

    private static final String CYCLE_ENDED_MESSAGE =
            "Your FYP cycle has ended — your access is read-only.";

    private final ProjectRepository projectRepository;

    public boolean isCycleActive(Long studentUserId) {
        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(studentUserId);
        if (projectOpt.isEmpty()) {
            // No project at all — treat as "active" for write checks (e.g. brand-new student
            // submitting a supervisor request before being attached to a placeholder).
            return true;
        }
        FypCycle cycle = projectOpt.get().getCycle();
        if (cycle == null || cycle.getStatus() == null) return true;
        return cycle.getStatus() == CycleStatus.PLANNING || cycle.getStatus() == CycleStatus.ACTIVE;
    }

    public CycleStatus currentCycleStatus(Long studentUserId) {
        return projectRepository.findByStudent_UserId(studentUserId)
                .map(Project::getCycle)
                .map(FypCycle::getStatus)
                .orElse(null);
    }

    public void requireActiveCycle(Long studentUserId) {
        if (!isCycleActive(studentUserId)) {
            throw new ForbiddenException(CYCLE_ENDED_MESSAGE);
        }
    }
}
