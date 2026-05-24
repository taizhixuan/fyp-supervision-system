package com.fyp.supervision.repository;

import com.fyp.supervision.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface AnnouncementReadRepository
        extends JpaRepository<AnnouncementRead, AnnouncementRead.Id> {

    boolean existsByUserIdAndAnnouncementId(Long userId, Long announcementId);

    @Query("select r.announcementId from AnnouncementRead r where r.userId = :userId and r.announcementId in :ids")
    List<Long> findReadAnnouncementIds(@Param("userId") Long userId, @Param("ids") Collection<Long> ids);

    default Set<Long> readIdsForUser(Long userId, Collection<Long> announcementIds) {
        if (userId == null || announcementIds == null || announcementIds.isEmpty()) return Set.of();
        return Set.copyOf(findReadAnnouncementIds(userId, announcementIds));
    }

    @Modifying
    @Query(value = "INSERT IGNORE INTO announcement_read (user_id, announcement_id, read_at) VALUES (:userId, :announcementId, NOW())", nativeQuery = true)
    int insertIgnore(@Param("userId") Long userId, @Param("announcementId") Long announcementId);
}
