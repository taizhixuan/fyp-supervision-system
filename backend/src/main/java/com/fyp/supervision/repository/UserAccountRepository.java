package com.fyp.supervision.repository;

import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmail(String email);
    Optional<UserAccount> findByMmuId(String mmuId);
    boolean existsByEmail(String email);
    boolean existsByMmuId(String mmuId);

    @Query("SELECT u FROM UserAccount u WHERE u.email = :identifier OR u.mmuId = :identifier")
    Optional<UserAccount> findByEmailOrMmuId(@Param("identifier") String identifier);

    Page<UserAccount> findByRole(UserRole role, Pageable pageable);
    Page<UserAccount> findByStatus(UserStatus status, Pageable pageable);
    Page<UserAccount> findByRoleAndStatus(UserRole role, UserStatus status, Pageable pageable);

    @Query("SELECT u FROM UserAccount u WHERE u.role = :role AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%')) OR u.mmuId LIKE CONCAT('%',:search,'%'))")
    Page<UserAccount> searchByRoleAndTerm(@Param("role") UserRole role, @Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM UserAccount u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%')) OR u.mmuId LIKE CONCAT('%',:search,'%')")
    Page<UserAccount> searchByTerm(@Param("search") String search, Pageable pageable);

    // ---- Cycle-scoped student queries (admin UserManagement cycle filter) ---
    // Students enrolled in a given cycle = users with a Project whose cycle_id matches.
    // Returns distinct students; status/search optional. Roles other than STUDENT can't
    // be in a cycle, so these finders implicitly scope to STUDENT.

    @Query("SELECT DISTINCT u FROM UserAccount u JOIN Project p ON p.student.userId = u.userId " +
           "WHERE p.cycle.cycleId = :cycleId AND u.role = com.fyp.supervision.enums.UserRole.STUDENT")
    Page<UserAccount> findStudentsByCycle(@Param("cycleId") Long cycleId, Pageable pageable);

    @Query("SELECT DISTINCT u FROM UserAccount u JOIN Project p ON p.student.userId = u.userId " +
           "WHERE p.cycle.cycleId = :cycleId AND u.role = com.fyp.supervision.enums.UserRole.STUDENT " +
           "AND u.status = :status")
    Page<UserAccount> findStudentsByCycleAndStatus(@Param("cycleId") Long cycleId, @Param("status") UserStatus status, Pageable pageable);

    @Query("SELECT DISTINCT u FROM UserAccount u JOIN Project p ON p.student.userId = u.userId " +
           "WHERE p.cycle.cycleId = :cycleId AND u.role = com.fyp.supervision.enums.UserRole.STUDENT " +
           "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%')) OR u.mmuId LIKE CONCAT('%',:search,'%'))")
    Page<UserAccount> searchStudentsByCycleAndTerm(@Param("cycleId") Long cycleId, @Param("search") String search, Pageable pageable);

    long countByRole(UserRole role);
    long countByStatus(UserStatus status);
    long countByRoleAndStatus(UserRole role, UserStatus status);

    List<UserAccount> findByUserIdIn(List<Long> userIds);

    List<UserAccount> findByStatusOrderByCreatedAtAsc(UserStatus status);

    List<UserAccount> findByRoleAndStatus(UserRole role, UserStatus status);
}
