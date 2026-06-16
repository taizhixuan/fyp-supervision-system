package com.fyp.supervision.repository;

import com.fyp.supervision.entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {

    Optional<PendingRegistration> findByEmail(String email);

    @Modifying
    @Query("delete from PendingRegistration p where p.email = :email")
    void deleteAllByEmail(@Param("email") String email);

    @Modifying
    @Query("delete from PendingRegistration p where p.expiresAt < :cutoff or p.usedAt is not null")
    int deleteExpiredOrUsed(@Param("cutoff") LocalDateTime cutoff);
}
