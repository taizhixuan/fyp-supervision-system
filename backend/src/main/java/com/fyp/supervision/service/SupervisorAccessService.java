package com.fyp.supervision.service;

import com.fyp.supervision.entity.*;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Centralised ownership checks for supervisor-side endpoints. Each method
 * loads the entity by id and throws {@link ForbiddenException} if the caller
 * is not the supervisor on it. Use this from any controller method that
 * accepts an entity id from the URL — without it, any supervisor can read or
 * mutate another supervisor's records.
 */
@Service
@RequiredArgsConstructor
public class SupervisorAccessService {

    private final SupervisorRequestRepository supervisorRequestRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogRepository meetingLogRepository;

    public SupervisorRequest requireOwnRequest(Long supervisorUserId, Long requestId) {
        SupervisorRequest req = supervisorRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        Long owner = req.getSupervisorUser() != null ? req.getSupervisorUser().getUserId() : null;
        ensureOwner(supervisorUserId, owner, "request");
        return req;
    }

    public Project requireOwnProject(Long supervisorUserId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        Long owner = project.getSupervisor() != null ? project.getSupervisor().getUserId() : null;
        ensureOwner(supervisorUserId, owner, "project");
        return project;
    }

    public Proposal requireOwnProposal(Long supervisorUserId, Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        Long owner = proposal.getSupervisor() != null ? proposal.getSupervisor().getUserId() : null;
        if (owner == null && proposal.getProject() != null && proposal.getProject().getSupervisor() != null) {
            owner = proposal.getProject().getSupervisor().getUserId();
        }
        ensureOwner(supervisorUserId, owner, "proposal");
        return proposal;
    }

    public Meeting requireOwnMeeting(Long supervisorUserId, Long meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        Long owner = meeting.getProject() != null && meeting.getProject().getSupervisor() != null
                ? meeting.getProject().getSupervisor().getUserId() : null;
        ensureOwner(supervisorUserId, owner, "meeting");
        return meeting;
    }

    public MeetingLog requireOwnLog(Long supervisorUserId, Long logId) {
        MeetingLog log = meetingLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting log not found"));
        Long owner = log.getSupervisor() != null ? log.getSupervisor().getUserId() : null;
        ensureOwner(supervisorUserId, owner, "meeting log");
        return log;
    }

    private void ensureOwner(Long callerUserId, Long ownerUserId, String resource) {
        if (callerUserId == null || ownerUserId == null || !Objects.equals(callerUserId, ownerUserId)) {
            throw new ForbiddenException("You can only access your own " + resource + ".");
        }
    }
}
