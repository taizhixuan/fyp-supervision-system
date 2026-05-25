package com.fyp.supervision.repository;

import com.fyp.supervision.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUser_UserIdAndReadAtIsNull(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = CURRENT_TIMESTAMP WHERE n.user.userId = :userId AND n.readAt IS NULL")
    void markAllAsRead(@Param("userId") Long userId);

    /** Bulk-delete notifications older than the given cutoff. Returns count purged. */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") java.time.LocalDateTime cutoff);
}
