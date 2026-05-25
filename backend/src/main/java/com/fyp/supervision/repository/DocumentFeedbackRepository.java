package com.fyp.supervision.repository;

import com.fyp.supervision.entity.DocumentFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentFeedbackRepository extends JpaRepository<DocumentFeedback, Long> {
    List<DocumentFeedback> findByDocument_DocumentIdOrderByCreatedAtDesc(Long documentId);

    long countByDocument_Project_Supervisor_UserId(Long supervisorUserId);
}
