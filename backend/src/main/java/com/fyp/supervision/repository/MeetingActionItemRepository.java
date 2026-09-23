package com.fyp.supervision.repository;

import com.fyp.supervision.entity.MeetingActionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingActionItemRepository extends JpaRepository<MeetingActionItem, Long> {
    List<MeetingActionItem> findByProject_ProjectIdOrderByCreatedAtDesc(Long projectId);

    List<MeetingActionItem> findByMeeting_MeetingIdOrderByCreatedAtAsc(Long meetingId);

    List<MeetingActionItem> findByProject_ProjectIdAndStatusOrderByCreatedAtAsc(Long projectId, String status);

    long countByProject_ProjectIdAndStatus(Long projectId, String status);
}
