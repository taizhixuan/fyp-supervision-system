package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.enums.AnnouncementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    Page<Announcement> findByStatusOrderByCreatedAtDesc(AnnouncementStatus status, Pageable pageable);
    List<Announcement> findTop5ByStatusOrderByCreatedAtDesc(AnnouncementStatus status);
    Page<Announcement> findByCreatedBy_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
