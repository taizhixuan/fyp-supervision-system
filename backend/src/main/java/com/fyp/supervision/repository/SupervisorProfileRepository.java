package com.fyp.supervision.repository;

import com.fyp.supervision.entity.SupervisorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupervisorProfileRepository
        extends JpaRepository<SupervisorProfile, Long>, JpaSpecificationExecutor<SupervisorProfile> {

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR'")
    Page<SupervisorProfile> findAllActiveSupervisors(Pageable pageable);

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR' " +
           "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(sp.researchAreas) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(sp.department) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<SupervisorProfile> searchSupervisors(@Param("search") String search, Pageable pageable);

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR' AND sp.currentLoad < sp.supervisionQuota")
    Page<SupervisorProfile> findAvailableSupervisors(Pageable pageable);

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR' AND LOWER(sp.faculty) = LOWER(:faculty)")
    Page<SupervisorProfile> findByFaculty(@Param("faculty") String faculty, Pageable pageable);

    @Query("select count(sp) from SupervisorProfile sp where sp.currentLoad > sp.supervisionQuota")
    long countOverloaded();

    /**
     * Row-locks the profile so concurrent accepts for the same supervisor run one at a
     * time; the capacity check and the pairing then can't interleave (see respondToRequest).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sp FROM SupervisorProfile sp WHERE sp.userId = :userId")
    Optional<SupervisorProfile> findByIdForUpdate(@Param("userId") Long userId);

    // current_load is a cached count of supervised projects whose cycle hasn't ended.
    // Recount rather than increment/decrement so it can't drift when cycles complete.
    String LIVE_LOAD_SUBQUERY =
            "(SELECT COUNT(*) FROM project p LEFT JOIN fyp_cycle c ON c.cycle_id = p.cycle_id "
            + "WHERE p.supervisor_user_id = sp.user_id "
            + "AND (c.cycle_id IS NULL OR c.status NOT IN ('COMPLETED','ARCHIVED')))";

    @Modifying
    @Query(value = "UPDATE supervisor_profile sp SET sp.current_load = " + LIVE_LOAD_SUBQUERY
            + " WHERE sp.user_id = :userId", nativeQuery = true)
    int recountCurrentLoad(@Param("userId") Long userId);

    @Modifying
    @Query(value = "UPDATE supervisor_profile sp SET sp.current_load = " + LIVE_LOAD_SUBQUERY, nativeQuery = true)
    int recountAllCurrentLoads();
}
