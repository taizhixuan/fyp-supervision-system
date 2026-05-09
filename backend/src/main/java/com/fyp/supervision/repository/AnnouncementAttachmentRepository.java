package com.fyp.supervision.repository;

import com.fyp.supervision.entity.AnnouncementAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementAttachmentRepository extends JpaRepository<AnnouncementAttachment, Long> {
    List<AnnouncementAttachment> findByAnnouncement_AnnouncementId(Long announcementId);
}
