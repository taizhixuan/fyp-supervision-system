package com.fyp.supervision.repository;

import com.fyp.supervision.entity.SupervisorTopic;
import com.fyp.supervision.enums.TopicStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupervisorTopicRepository extends JpaRepository<SupervisorTopic, Long> {

    List<SupervisorTopic> findBySupervisor_UserIdOrderByCreatedAtDesc(Long supervisorUserId);

    List<SupervisorTopic> findByStatusOrderByCreatedAtAsc(TopicStatus status);

    List<SupervisorTopic> findByStatusOrderByCreatedAtDesc(TopicStatus status);
}
