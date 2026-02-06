package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ResourceDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceDocumentRepository extends JpaRepository<ResourceDocument, Long> {
    Page<ResourceDocument> findByIsActiveTrueOrderByPublishedAtDesc(Pageable pageable);
    Page<ResourceDocument> findByCategoryAndIsActiveTrueOrderByPublishedAtDesc(String category, Pageable pageable);
    Page<ResourceDocument> findByVisibilityAndIsActiveTrueOrderByPublishedAtDesc(String visibility, Pageable pageable);

    @Query("SELECT DISTINCT r.category FROM ResourceDocument r WHERE r.isActive = true")
    List<String> findDistinctCategories();
}
