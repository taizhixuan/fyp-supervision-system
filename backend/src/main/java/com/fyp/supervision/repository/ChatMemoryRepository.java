package com.fyp.supervision.repository;

import com.fyp.supervision.entity.ChatMemory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMemoryRepository extends JpaRepository<ChatMemory, Long> {
}
