package com.fyp.supervision.repository;

import com.fyp.supervision.entity.SystemParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemParameterRepository extends JpaRepository<SystemParameter, Long> {
    Optional<SystemParameter> findByParamKey(String paramKey);
    List<SystemParameter> findByCategoryOrderByParamKeyAsc(String category);
}
