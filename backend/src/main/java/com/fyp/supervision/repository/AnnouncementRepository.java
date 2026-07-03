package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.enums.AnnouncementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    Page<Announcement> findByStatusOrderByCreatedAtDesc(AnnouncementStatus status, Pageable pageable);
    Page<Announcement> findByStatusInOrderByCreatedAtDesc(Collection<AnnouncementStatus> statuses, Pageable pageable);
    List<Announcement> findTop5ByStatusOrderByCreatedAtDesc(AnnouncementStatus status);
    Page<Announcement> findByCreatedBy_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Scheduled announcements whose publish time has arrived — used by the publisher job. */
    List<Announcement> findByStatusAndPublishAtLessThanEqual(AnnouncementStatus status, LocalDateTime cutoff);

    /** Atomic view-count bump so concurrent first-time reads can't lose an increment. */
    @Modifying
    @Query("UPDATE Announcement a SET a.viewCount = COALESCE(a.viewCount, 0) + 1 WHERE a.announcementId = :id")
    int incrementViewCount(@Param("id") Long id);
}
