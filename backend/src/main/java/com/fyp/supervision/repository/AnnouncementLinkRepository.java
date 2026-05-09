package com.fyp.supervision.repository;

import com.fyp.supervision.entity.AnnouncementLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementLinkRepository extends JpaRepository<AnnouncementLink, Long> {
    List<AnnouncementLink> findByAnnouncement_AnnouncementId(Long announcementId);
}
