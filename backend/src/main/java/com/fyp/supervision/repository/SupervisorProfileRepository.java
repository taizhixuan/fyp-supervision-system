package com.fyp.supervision.repository;

import com.fyp.supervision.entity.SupervisorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SupervisorProfileRepository extends JpaRepository<SupervisorProfile, Long> {

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR'")
    Page<SupervisorProfile> findAllActiveSupervisors(Pageable pageable);

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR' " +
           "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(sp.researchAreas) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(sp.department) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<SupervisorProfile> searchSupervisors(@Param("search") String search, Pageable pageable);

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR' AND sp.currentLoad < sp.supervisionQuota")
    Page<SupervisorProfile> findAvailableSupervisors(Pageable pageable);

    @Query("SELECT sp FROM SupervisorProfile sp JOIN sp.user u WHERE u.status = 'ACTIVE' AND u.role = 'SUPERVISOR' AND LOWER(sp.faculty) = LOWER(:faculty)")
    Page<SupervisorProfile> findByFaculty(@Param("faculty") String faculty, Pageable pageable);
}
