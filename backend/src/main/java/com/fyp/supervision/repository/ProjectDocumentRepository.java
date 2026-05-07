package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ProjectDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {
    Page<ProjectDocument> findByProject_ProjectIdOrderByUploadedAtDesc(Long projectId, Pageable pageable);
    Page<ProjectDocument> findByProject_Student_UserIdOrderByUploadedAtDesc(Long studentUserId, Pageable pageable);
    Page<ProjectDocument> findByProject_Student_UserIdAndPhaseOrderByUploadedAtDesc(Long studentUserId, String phase, Pageable pageable);
    Page<ProjectDocument> findByProject_Student_UserIdAndDocTypeOrderByUploadedAtDesc(Long studentUserId, String docType, Pageable pageable);
    Page<ProjectDocument> findByProject_Student_UserIdAndDocTypeAndPhaseOrderByUploadedAtDesc(Long studentUserId, String docType, String phase, Pageable pageable);
    List<ProjectDocument> findByProject_Student_UserIdOrderByUploadedAtDesc(Long studentUserId);
    List<ProjectDocument> findByProject_Student_UserIdAndDocTypeOrderByUploadedAtDesc(Long studentUserId, String docType);
    long countByProject_Student_UserId(Long studentUserId);
    List<ProjectDocument> findByProject_Supervisor_UserIdOrderByUploadedAtDesc(Long supervisorUserId);
}
