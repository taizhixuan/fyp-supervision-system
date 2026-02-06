package com.fyp.supervision.repository;

import com.fyp.supervision.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityType IS NULL OR a.entityName = :entityType) AND " +
           "(:userId IS NULL OR a.user.userId = :userId) AND " +
           "(:dateFrom IS NULL OR a.createdAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR a.createdAt <= :dateTo) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findWithFilters(@Param("action") String action,
                                    @Param("entityType") String entityType,
                                    @Param("userId") Long userId,
                                    @Param("dateFrom") LocalDateTime dateFrom,
                                    @Param("dateTo") LocalDateTime dateTo,
                                    Pageable pageable);
}
